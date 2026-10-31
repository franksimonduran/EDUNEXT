"""Password policy validation."""

import re
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class PasswordPolicy:
    """Password policy configuration."""
    min_length: int = 15
    max_length: int = 128
    require_uppercase: bool = False
    require_lowercase: bool = False
    require_digits: bool = False
    require_symbols: bool = False
    block_common_passwords: bool = True
    max_repeating_chars: int = 3


# Common passwords to block (first 100 most common)
COMMON_PASSWORDS = {
    "password", "123456", "123456789", "guest", "qwerty", "abc123",
    "letmein", "admin", "welcome", "monkey", "dragon", "master",
    "hello", "freedom", "whatever", "qazwsx", "trustno1", "jordan23",
    "harley", "password1", "qwertyuiop", "asdfghjkl", "zxcvbnm",
    "superman", "batman", "iloveyou", "sunshine", "princess", "football",
    "baseball", "shadow", "michael", "jordan", "jennifer", "hunter",
    "chocolate", "andrew", "michelle", "jessica", "daniel", "amanda",
    "thomas", "maggie", "ginger", "charlie", "buster", "samantha",
    "computer", "yellow", "purple", "orange", "mickey", "cheese",
    "pepper", "taylor", "george", "cooper", "summer", "heather",
    "hammer", "anthony", "member", "access", "love", "starwars",
    "solo", "chelsea", "matthew", "diamond", "william", "phoenix",
    "lauren", "boston", "angel", "madison", "winston", "nicole",
    "jackson", "cameron", "thunder", "tiffany", "sophie", "jasmine",
}


def validate_password(
    password: str,
    policy: Optional[PasswordPolicy] = None,
    user_attributes: Optional[dict] = None
) -> Tuple[bool, List[str]]:
    """Validate a password against the policy.
    
    Args:
        password: The password to validate
        policy: Password policy to apply (uses default if None)
        user_attributes: User attributes to check against (name, email, etc.)
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    if policy is None:
        policy = PasswordPolicy()
    
    errors = []
    
    # Length checks
    if len(password) < policy.min_length:
        errors.append(f"Password must be at least {policy.min_length} characters long")
    if len(password) > policy.max_length:
        errors.append(f"Password must not exceed {policy.max_length} characters")
    
    # Character variety (optional)
    if policy.require_uppercase and not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    if policy.require_lowercase and not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    if policy.require_digits and not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")
    if policy.require_symbols and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    # Repeating characters
    if policy.max_repeating_chars > 0:
        repeating_pattern = r'(.)\1{' + str(policy.max_repeating_chars) + r',}'
        if re.search(repeating_pattern, password):
            errors.append(f"Password must not contain more than {policy.max_repeating_chars} repeating characters")
    
    # Common passwords
    if policy.block_common_passwords:
        if password.lower() in COMMON_PASSWORDS:
            errors.append("Password is too common, please choose a different one")
    
    # User attributes
    if user_attributes:
        for attr_value in user_attributes.values():
            if attr_value and len(str(attr_value)) >= 3:
                if str(attr_value).lower() in password.lower():
                    errors.append("Password must not contain personal information")
    
    # Sequential characters (abc, 123, etc.)
    if _has_sequential_chars(password):
        errors.append("Password must not contain sequential characters")
    
    return len(errors) == 0, errors


def _has_sequential_chars(password: str, min_seq: int = 4) -> bool:
    """Check for sequential characters in password."""
    password_lower = password.lower()
    
    # Check alphabetical sequences
    for i in range(len(password_lower) - min_seq + 1):
        seq = password_lower[i:i+min_seq]
        # Forward sequence
        if all(ord(seq[j+1]) - ord(seq[j]) == 1 for j in range(len(seq)-1)):
            return True
        # Reverse sequence
        if all(ord(seq[j]) - ord(seq[j+1]) == 1 for j in range(len(seq)-1)):
            return True
    
    # Check numeric sequences
    for i in range(len(password) - min_seq + 1):
        seq = password[i:i+min_seq]
        if seq.isdigit():
            if all(int(seq[j+1]) - int(seq[j]) == 1 for j in range(len(seq)-1)):
                return True
            if all(int(seq[j]) - int(seq[j+1]) == 1 for j in range(len(seq)-1)):
                return True
    
    return False


def get_password_strength(password: str) -> dict:
    """Calculate password strength score and feedback."""
    score = 0
    feedback = []
    
    # Length
    if len(password) >= 15:
        score += 2
    elif len(password) >= 12:
        score += 1
    else:
        feedback.append("Use at least 15 characters")
    
    # Character variety
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_symbol = bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    
    variety = sum([has_upper, has_lower, has_digit, has_symbol])
    score += variety
    
    if variety < 3:
        feedback.append("Mix uppercase, lowercase, numbers, and symbols")
    
    # Entropy estimation
    if len(password) > 0:
        pool_size = 0
        if has_lower: pool_size += 26
        if has_upper: pool_size += 26
        if has_digit: pool_size += 10
        if has_symbol: pool_size += 32
        
        import math
        entropy = len(password) * math.log2(max(pool_size, 2))
        
        if entropy < 60:
            feedback.append("Consider a longer passphrase")
    
    return {
        "score": min(score, 4),
        "entropy_bits": entropy if 'entropy' in locals() else 0,
        "feedback": feedback,
        "strength": "weak" if score < 2 else "fair" if score < 3 else "good" if score < 4 else "strong"
    }


DEFAULT_POLICY = PasswordPolicy(
    min_length=15,
    max_length=128,
    require_uppercase=False,
    require_lowercase=False,
    require_digits=False,
    require_symbols=False,
    block_common_passwords=True,
    max_repeating_chars=3,
)


STUDENT_POLICY = PasswordPolicy(
    min_length=12,
    max_length=128,
    require_uppercase=False,
    require_lowercase=False,
    require_digits=False,
    require_symbols=False,
    block_common_passwords=True,
    max_repeating_chars=3,
)


ADMIN_POLICY = PasswordPolicy(
    min_length=16,
    max_length=128,
    require_uppercase=True,
    require_lowercase=True,
    require_digits=True,
    require_symbols=True,
    block_common_passwords=True,
    max_repeating_chars=2,
)