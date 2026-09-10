import pytest


def pytest_collection_modifyitems(config, items):
    """Preserve declaration order so login/change → dependent tests run in sequence."""
    # pytest already keeps file order; ensure classes remain in order
    pass
