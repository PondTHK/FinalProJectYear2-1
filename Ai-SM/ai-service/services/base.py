from abc import ABC, abstractmethod

class AIService(ABC):
    @abstractmethod
    def analyze_personality(self, posts: list[str]) -> dict:
        pass

    @abstractmethod
    def chat(self, message: str) -> str:
        pass

    @abstractmethod
    def parse_resume(self, file_path: str, file_type: str) -> dict:
        pass

    @abstractmethod
    def match_jobs(self, user_data: dict, job_posts: list[dict]) -> dict:
        pass
