from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Group(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class GroupMember(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.group.name}"

class GroupActivity(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)

    def save(self, *args, **kwargs):

        if self.end_time and self.start_time:
            if timezone.is_naive(self.start_time):
                self.start_time = timezone.make_aware(self.start_time)

            if timezone.is_naive(self.end_time):
                self.end_time = timezone.make_aware(self.end_time)

            self.duration = self.end_time - self.start_time
            print("Start:", self.start_time)
            print("End:", self.end_time)
            print("Delta:", self.duration)
        super().save(*args, **kwargs)