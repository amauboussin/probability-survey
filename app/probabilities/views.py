from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.views.decorators.cache import cache_page

from probabilities.forms import PROB_FIELDS, SurveyForm
from probabilities.models import DEMOGRAPHIC_FIELDS, SurveyResponse, GENDER_CHOICES, AGE_CHOICES, ESL_CHOICES


def home(request):
    if request.method == 'POST':
        form = SurveyForm(request.POST)
        if form.is_valid():
            response = SurveyResponse(**form.cleaned_data)
            response.save()
            prob_response = [(q, a) for q, a in form.cleaned_data.items()
                             if q not in DEMOGRAPHIC_FIELDS and a is not None]
            print(prob_response)
            ctx = {'response': prob_response,
                   'show_individual_results': True,
                   'probability_words': PROB_FIELDS,
                   'age_choices': dict(AGE_CHOICES),
                   'gender_choices': dict(GENDER_CHOICES),
                   'esl_choices': dict(ESL_CHOICES),
                   'show_chart': False
                   }
            return render(request, 'results.html', ctx)

    else:
        form = SurveyForm()
    return render(request, 'homepage.html', {'form': form})


def results_page(request):
    return render(request, 'results.html', {'probability_words': PROB_FIELDS,
                                            'age_choices': dict(AGE_CHOICES),
                                            'gender_choices': dict(GENDER_CHOICES),
                                            'esl_choices': dict(ESL_CHOICES),
                                            'show_chart': False
                                            })

def results(request):
    filters = request.GET

    def filter_function(response):
        for filter_key, filter_value in filters.items():
            if filter is not None and getattr(response, filter_key) != filter_value:
                return True
        return False
    responses = SurveyResponse.objects.all()
    responses_by_word = {
        word:
        {
            p: 0 for p in range(0, 101)
        }
        for word in PROB_FIELDS
    }
    for resp in responses:
        for word in PROB_FIELDS:
            if filter_function(resp):
                continue
            value = getattr(resp, word)
            if value is None:
                continue
            responses_by_word[word][value] += 1

    return JsonResponse({'responses': responses_by_word})


def results_dump(request):
    from django.core import serializers
    data = serializers.serialize("json", SurveyResponse.objects.all())
    return HttpResponse(data, content_type='application/json')