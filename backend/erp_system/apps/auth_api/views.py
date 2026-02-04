from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint for obtaining authentication token
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
            status=HTTP_400_BAD_REQUEST
        )

    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'username': user.username,
        'email': user.email,
    }, status=HTTP_200_OK)


@api_view(['POST'])
def logout_view(request):
    """
    Logout endpoint - deletes the user's token
    """
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Successfully logged out'}, status=HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=HTTP_400_BAD_REQUEST)
