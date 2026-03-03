from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer, ForgotPasswordSerializer

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response(
            {"user": RegisterSerializer(user).data, "tokens": tokens},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)
        return Response(
            {"user": {"id": user.id, "name": user.name, "email": user.email}, "tokens": tokens},
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()

        # security: always respond success even if email not found
        if user:
            token = default_token_generator.make_token(user)
            # For now we'll just print/send token. Later we’ll build a real reset UI page.
            reset_payload = f"Use this token to reset your password: {token}"
            send_mail(
                subject="E-Track Password Reset",
                message=reset_payload,
                from_email=None,
                recipient_list=[email],
                fail_silently=True,
            )

        return Response(
            {"message": "If this email exists, a reset instruction has been sent."},
            status=status.HTTP_200_OK,
        )