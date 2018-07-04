
from django import template

register = template.Library()


def format_probability_word(word):
    return word.replace('_', ' ').title()

register.filter('format_probability_word', format_probability_word)
