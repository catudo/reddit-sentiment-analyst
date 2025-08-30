
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    # Call DRF's default exception handler first
    response = drf_exception_handler(exc, context)

    if response is not None:
        # Customize the error response
        response.data = {
            "status": "error",
            "message": response.data.get("detail", "An error occurred"),
        }
    else:
        # Handle non-DRF exceptions
        response = Response(
            {"status": "error", "message": "An unexpected error occurred"},
            status=500,
        )

    return response