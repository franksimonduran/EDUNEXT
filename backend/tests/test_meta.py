"""Tests for metadata endpoints."""

import pytest
from fastapi.testclient import TestClient


class TestMetaEndpoints:
    """Tests for metadata endpoints."""

    def test_meta(self, client):
        """Test metadata endpoint."""
        response = client.get("/api/v1/meta")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "EDUNEXT Backend"
        assert data["api_version"] == "v1"
        assert "description" in data
        assert "docs_url" in data

    def test_version(self, client):
        """Test version endpoint."""
        response = client.get("/api/v1/meta/version")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "0.1.0"
        assert data["api_version"] == "v1"
