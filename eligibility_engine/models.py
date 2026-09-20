from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class NoticeCriteria:
    eligible_branches: Optional[List[str]] = None
    eligible_years: Optional[List[int]] = None
    min_cgpa: Optional[float] = None
    max_active_backlogs: Optional[int] = None
    min_tenth_percentage: Optional[float] = None
    min_twelfth_percentage: Optional[float] = None
    eligible_degrees: Optional[List[str]] = None

@dataclass
class StudentProfile:
    student_id: str
    branch: Optional[str] = None
    year: Optional[int] = None
    cgpa: Optional[float] = None
    active_backlogs: Optional[int] = None
    tenth_percentage: Optional[float] = None
    twelfth_percentage: Optional[float] = None
    degree: Optional[str] = None

@dataclass
class EligibilityResult:
    status: str
    reasons: List[str] = field(default_factory=list)
    missing_information: List[str] = field(default_factory=list)
    action_items: List[str] = field(default_factory=list)
