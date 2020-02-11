import flask_login

class User(flask_login.UserMixin):
    """just a typical user, nothing fancy..."""
    def __init__(self, user_id):
        """create  a new  user"""
        self.id = user_id

    @staticmethod
    def get(user_id):
        # we know everybody
        return User(user_id)
