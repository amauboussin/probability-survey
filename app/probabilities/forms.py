from random import shuffle

from crispy_forms.bootstrap import AppendedText
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Div, HTML, Layout, Submit
from django import forms
from django.utils.translation import gettext_lazy as _

from .models import SurveyResponse

PROB_FIELDS = ['always', 'almost_always', 'certainly', 'likely', 'unlikely',
               'probably', 'frequently', 'not_often', 'usually', 'possibly',
               'never', 'almost_certainly', 'with_high_probability', 'with_low_probability',
               'with_moderate_probability', 'more_often_than_not', 'often', 'rarely',
               'maybe', 'might_happen', 'serious_possibility', 'real_possibility', 'slam_dunk',
               ]

DEMO_FIELDS = ['gender', 'age', 'esl', ]


class SurveyForm(forms.ModelForm):

    class Meta:
        model = SurveyResponse

        labels = {
            'we_doubt': _('We Doubt'),
            'esl': _('Native English Speaker'),
        }

        fields = tuple(PROB_FIELDS + DEMO_FIELDS)

    def __init__(self, *args, **kwargs):
        super(SurveyForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper()

        self.helper.form_id = 'probability-form'
        self.helper.form_method = 'post'

        self.helper.form_class = 'form-horizontal'
        self.helper.label_class = 'col-xs-offset-2 col-xs-2'
        self.helper.field_class = 'col-md-2 col-xs-4'
        disclaimer = 'This information will provide insight into how different groups interpret probabilistic words. All responses are anonymous.'

        shuffle(PROB_FIELDS)
        prob_title = HTML('<h5 class="col-xs-offset-1 page-header"> Enter a probability for each word </h5>')
        prob_layout = Div(*[AppendedText(f, '%', pattern='\d*') for f in PROB_FIELDS], css_id='prob-fields')
        demo_title = HTML('<h5 class="col-xs-offset-1 page-header"> Optional demographic info </h5>')
        demo_explanation = HTML('<p class="col-xs-offset-1">{}</p><p'.format(disclaimer))

        demo_layout = Div(*DEMO_FIELDS, css_id='demo-survey')
        submit_button = Submit('submit', 'Submit and See Results', css_class='col-xs-offset-1')
        self.helper.layout = Layout(prob_title, prob_layout, demo_title, demo_explanation, demo_layout, submit_button)


