#!/usr/bin/env zsh
# orthocal-python @ 36c366f8039a174c7789458bcda9a2ef77704f93
python3 -m venv env
env/bin/pip install --upgrade pip
env/bin/pip install --no-cache-dir -r orthocal-python/requirements.txt
env/bin/python ./manage.py collectstatic --noinput
env/bin/python ./orthocal-python/manage.py migrate
env/bin/python ./orthocal-python/manage.py loaddata calendarium commemorations
