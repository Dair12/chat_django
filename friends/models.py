from django.db import models
from django.contrib.auth.models import User

class Friend(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends')
    contact = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contact_of')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('owner', 'contact')  # Один и тот же контакт не может быть добавлен дважды

    def __str__(self):
        return f"{self.owner.username} -> {self.contact.username}"
