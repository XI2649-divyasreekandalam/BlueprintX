from typing import List, Dict, Any, Optional, Callable
from enum import Enum
import logging
import time
from app.agents.base_agent import BaseAgent


logger = logging.getLogger(__name__)


class ExecutionState(Enum):
    """Execution state for orchestrator steps."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"


class OrchestratorStep:
    """
    Represents a single step in the orchestrator flow.
    
    Attributes:
        name: Unique name for this step
        agent: The agent to execute
        retries: Number of retry attempts (default: 0)
        retry_delay: Delay in seconds between retries (default: 1.0)
        on_failure: Optional callback function for failure handling
    """
    
    def __init__(
        self,
        name: str,
        agent: BaseAgent,
        retries: int = 0,
        retry_delay: float = 1.0,
        on_failure: Optional[Callable[[Dict[str, Any], Exception], Dict[str, Any]]] = None
    ):
        self.name = name
        self.agent = agent
        self.retries = retries
        self.retry_delay = retry_delay
        self.on_failure = on_failure


class Orchestrator:
    """
    Orchestrator for executing agents sequentially in a defined flow.
    
    Manages the blueprint generation flow by:
    - Executing agents in sequence
    - Passing structured output between agents
    - Handling retries and failure states
    - Tracking execution state
    
    Attributes:
        steps: List of orchestrator steps to execute
        execution_log: Log of execution results for each step
    """
    
    def __init__(self, steps: List[OrchestratorStep]):
        """
        Initialize the orchestrator with a list of steps.
        
        Args:
            steps: List of OrchestratorStep instances defining the flow
        """
        if not steps:
            raise ValueError("Orchestrator must have at least one step")
        
        self.steps = steps
        self.execution_log: List[Dict[str, Any]] = []
    
    def _execute_step(
        self,
        step: OrchestratorStep,
        input_data: Dict[str, Any],
        attempt: int = 0
    ) -> Dict[str, Any]:
        """
        Execute a single step with retry logic.
        
        Args:
            step: The orchestrator step to execute
            input_data: Input data for the step
            attempt: Current attempt number (0-indexed)
        
        Returns:
            Output data from the step
        
        Raises:
            Exception: If step fails after all retries
        """
        if attempt > 0:
            logger.info(f"[Orchestrator] Retrying step '{step.name}' (attempt {attempt + 1})")
        else:
            logger.info(f"[Orchestrator] Executing step '{step.name}'")
        
        try:
            output = step.agent.execute(input_data)
            logger.info(f"[Orchestrator] Step '{step.name}' completed successfully")
            return output
        except Exception as e:
            logger.warning(f"[Orchestrator] Step '{step.name}' failed: {str(e)}")
            
            # Check if we should retry
            if attempt < step.retries:
                logger.info(
                    f"[Orchestrator] Retrying step '{step.name}' "
                    f"(attempt {attempt + 1}/{step.retries})"
                )
                time.sleep(step.retry_delay)
                return self._execute_step(step, input_data, attempt + 1)
            
            # All retries exhausted - handle failure
            if step.on_failure:
                try:
                    logger.info(f"[Orchestrator] Executing failure handler for '{step.name}'")
                    return step.on_failure(input_data, e)
                except Exception as handler_error:
                    logger.error(
                        f"[Orchestrator] Failure handler for '{step.name}' "
                        f"raised error: {str(handler_error)}"
                    )
                    raise handler_error from e
            
            # No failure handler - raise the exception
            raise
    
    def execute(self, initial_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete orchestrator flow.
        
        Executes all steps sequentially. Each step receives the cumulative
        results of all previous steps as input.
        
        Args:
            initial_input: Initial input data for the first step
        
        Returns:
            Cumulative dictionary containing results from all steps
        
        Raises:
            Exception: If any step fails and cannot be recovered
        """
        logger.info(f"[Orchestrator] Starting execution with {len(self.steps)} steps")
        self.execution_log = []
        
        # Cumulative state: starts with initial input
        cumulative_data = initial_input.copy()
        
        for i, step in enumerate(self.steps):
            step_log = {
                "step_name": step.name,
                "step_index": i,
                "state": ExecutionState.PENDING.value,
                "input": cumulative_data.copy(),
                "output": None,
                "error": None,
                "attempts": 0
            }
            
            try:
                # Execute step
                step_log["state"] = ExecutionState.RUNNING.value
                output = self._execute_step(step, cumulative_data)
                
                # Success - Add step output to cumulative data
                step_log["state"] = ExecutionState.SUCCESS.value
                step_log["output"] = output
                
                # We store step results under their step name to avoid collisions
                cumulative_data[step.name] = output
                
            except Exception as e:
                # Failure
                step_log["state"] = ExecutionState.FAILED.value
                step_log["error"] = str(e)
                self.execution_log.append(step_log)
                
                logger.error(
                    f"[Orchestrator] Flow failed at step '{step.name}': {str(e)}"
                )
                raise
            
            finally:
                self.execution_log.append(step_log)
        
        logger.info("[Orchestrator] Flow completed successfully")
        return cumulative_data
    
    def get_execution_log(self) -> List[Dict[str, Any]]:
        """
        Get the execution log for the last run.
        
        Returns:
            List of step execution logs
        """
        return self.execution_log.copy()
    
    def get_failed_steps(self) -> List[str]:
        """
        Get list of step names that failed in the last execution.
        
        Returns:
            List of failed step names
        """
        return [
            log["step_name"]
            for log in self.execution_log
            if log["state"] == ExecutionState.FAILED.value
        ]
    
    def get_successful_steps(self) -> List[str]:
        """
        Get list of step names that succeeded in the last execution.
        
        Returns:
            List of successful step names
        """
        return [
            log["step_name"]
            for log in self.execution_log
            if log["state"] == ExecutionState.SUCCESS.value
        ]

