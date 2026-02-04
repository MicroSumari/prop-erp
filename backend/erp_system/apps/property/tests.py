import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "erp_system.config.settings")
application = get_wsgi_application()
