"""Tests for system status endpoints."""

import pytest
from fastapi.testclient import TestClient


class TestSystemStatus:
    """Tests for system status endpoints."""

    def test_system_status(self, client):
        """Test system status endpoint."""
        response = client.get("/api/v1/system/status")
        assert response.status_code == 200
        data = response.json()
        assert data["api"] == "available"
        assert data["database"] == "available"
        assert data["athron_ai"] == "not_integrated"
        assert data["sync"] == "not_integrated"
        assert data["auth"] == "available"