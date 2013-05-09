import ast
import os
from django.db import models


class ListField(models.TextField):
    '''Got this from http://stackoverflow.com/questions/5216162/how-to-create-list-field-in-django'''
    __metaclass__ = models.SubfieldBase
    description = "Stores a python list"

    def __init__(self, *args, **kwargs):
            super(ListField, self).__init__(*args, **kwargs)

    def to_python(self, value):
            if not value:
                    value = []
            if isinstance(value, list):
                    return value
            return ast.literal_eval(value)

    def get_prep_value(self, value):
            if value is None:
                    return value
            return unicode(value)

    def value_to_string(self, obj):
            value = self._get_val_from_obj(obj)
            return self.get_db_prep_value(value)


def get_root_path():
    script_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(script_path, '..')
