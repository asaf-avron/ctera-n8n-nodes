#!/usr/bin/env python3
"""
Generate a test JWT token for MCP API testing.

This script generates a JWT token using the same HMAC-SHA256 pattern
as the Portal backend (WOPIUtils.java).

Usage:
    python generate_test_token.py
    python generate_test_token.py --master-key YOUR_KEY
    python generate_test_token.py --days 90

Requirements:
    pip install PyJWT
"""

import argparse
import datetime
import hashlib
import hmac
import sys

try:
    import jwt
except ImportError:
    print("Error: PyJWT not installed")
    print("Install with: pip install PyJWT")
    sys.exit(1)


def derive_secret(master_key: str, context: str) -> str:
    """
    Derive a secret from master key using HMAC-SHA256.
    
    This matches the Portal's WOPIUtils.generateOfficeKey() method.
    
    Args:
        master_key: The Portal master key
        context: The context string (e.g., "mcp", "wopi", "api")
    
    Returns:
        Hex-encoded derived secret
    """
    mac = hmac.new(
        master_key.encode('utf-8'),
        context.encode('utf-8'),
        hashlib.sha256
    )
    return mac.hexdigest()


def generate_token(
    master_key: str,
    audience: str = "mcp",
    subject: str = "test-user@ctera.com",
    user_id: int = 12345,
    tenant: str = "main",
    days: int = 30
) -> str:
    """
    Generate a JWT token for MCP authentication.
    
    Args:
        master_key: Portal master key
        audience: Token audience (mcp, wopi, api, etc.)
        subject: User email/identifier
        user_id: User ID
        tenant: Portal tenant name
        days: Token validity in days
    
    Returns:
        JWT token string
    """
    # Derive the secret for this audience
    secret = derive_secret(master_key, audience)
    
    # Build JWT payload
    now = datetime.datetime.utcnow()
    payload = {
        "iss": "ctera-portal",
        "aud": audience,
        "sub": subject,
        "uid": user_id,
        "tenant": tenant,
        "iat": now,
        "exp": now + datetime.timedelta(days=days)
    }
    
    # Generate token
    token = jwt.encode(payload, secret, algorithm="HS256")
    
    return token


def main():
    parser = argparse.ArgumentParser(
        description="Generate a test JWT token for MCP API testing"
    )
    parser.add_argument(
        "--master-key",
        default="test-master-key-for-local-development",
        help="Portal master key (default: test key)"
    )
    parser.add_argument(
        "--audience",
        default="mcp",
        choices=["mcp", "wopi", "api", "share", "mobile", "integration"],
        help="Token audience (default: mcp)"
    )
    parser.add_argument(
        "--subject",
        default="admin@ctera.com",
        help="User email/subject (default: admin@ctera.com)"
    )
    parser.add_argument(
        "--user-id",
        type=int,
        default=1,
        help="User ID (default: 1)"
    )
    parser.add_argument(
        "--tenant",
        default="main",
        help="Portal tenant (default: main)"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Token validity in days (default: 30)"
    )
    parser.add_argument(
        "--decode",
        action="store_true",
        help="Also decode and display the token contents"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("MCP Test Token Generator")
    print("=" * 60)
    print()
    
    # Generate token
    token = generate_token(
        master_key=args.master_key,
        audience=args.audience,
        subject=args.subject,
        user_id=args.user_id,
        tenant=args.tenant,
        days=args.days
    )
    
    print(f"Audience:   {args.audience}")
    print(f"Subject:    {args.subject}")
    print(f"User ID:    {args.user_id}")
    print(f"Tenant:     {args.tenant}")
    print(f"Valid for:  {args.days} days")
    print()
    print("=" * 60)
    print("JWT Token:")
    print("=" * 60)
    print(token)
    print()
    
    if args.decode:
        print("=" * 60)
        print("Decoded Token:")
        print("=" * 60)
        # Decode without verification (just to display)
        decoded = jwt.decode(token, options={"verify_signature": False})
        for key, value in decoded.items():
            if key in ("iat", "exp"):
                # Convert timestamps to readable dates
                dt = datetime.datetime.fromtimestamp(value)
                print(f"  {key}: {value} ({dt.isoformat()})")
            else:
                print(f"  {key}: {value}")
        print()
    
    print("=" * 60)
    print("Usage:")
    print("=" * 60)
    print(f"export TOKEN=\"{token}\"")
    print("./test-mcp-api.sh")
    print()
    print("Or in curl:")
    print(f"curl -H \"Authorization: Bearer {token[:50]}...\" ...")
    print()
    
    # Important warning
    print("=" * 60)
    print("⚠️  IMPORTANT")
    print("=" * 60)
    print("This token is for LOCAL TESTING ONLY.")
    print("For production, generate tokens via Portal Admin UI or API.")
    print()
    print("The master key must match Portal's configuration for the")
    print("token to be validated successfully by the MCP service.")


if __name__ == "__main__":
    main()

