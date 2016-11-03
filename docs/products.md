---
layout: default
title: Available tests
---

# Available tests

The tables below show all the available products of the 123test API. More products are in development and will be added later. Access to products is granted on a case-by-case basis. Please contact us for more information.

Information about tests themselves can be found online at: <a href="https://www.testingtalents.nl/tests.html">https://www.testingtalents.nl/tests.html</a>

## Tests in Dutch

<table class="product-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Description</th>
      <th>Standard Report</th>
      <th>Premium Report</th>
      <th>Standard PDF</th>
      <th>Premium PDF</th>
      <th>White label</th>
    </tr>
  </thead>

  {% for product in site.products %}
    {% if product.language == "nl" and product.status == "✅" %}
      <tr>
        <td><a href="{{ site.baseurl }}{{ product.url}}">{{ product.api-id}}</a></td>
        <td>{{ product.description }}</td>
        <td>{{ product.standard_report }}</td>
        <td>{{ product.premium_report }}</td>
        <td>{{ product.standard_pdf }}</td>
        <td>{{ product.premium_pdf }}</td>
        <td>{{ product.white_label }}</td>
      </tr>
    {% endif %}
  {% endfor %}
</table>

> <small>✅ = Available
  ❌ = Not Available
  🚧 = Under construction / will be available</small>

## Tests in English

<table class="product-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Description</th>
      <th>Standard Report</th>
      <th>Premium Report</th>
      <th>Standard PDF</th>
      <th>Premium PDF</th>
      <th>White label</th>
    </tr>
  </thead>

  {% for product in site.products %}
    {% if product.language == "en" and product.status == "✅" %}
      <tr>
        <td><a href="{{ product.id}}">{{ product.api-id}}</a></td>
        <td>{{ product.description }}</td>
        <td>{{ product.standard_report }}</td>
        <td>{{ product.premium_report }}</td>
        <td>{{ product.standard_pdf }}</td>
        <td>{{ product.premium_pdf }}</td>
        <td>{{ product.white_label }}</td>
      </tr>
    {% endif %}
  {% endfor %}
</table>

> <small>✅ = Available
  ❌ = Not Available
  🚧 = Under construction / will be available</small>

## In development

> Note: This is an incomplete list
<table class="product-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Description</th>
      <th>Standard Report</th>
      <th>Premium Report</th>
      <th>Standard PDF</th>
      <th>Premium PDF</th>
      <th>White label</th>
    </tr>
  </thead>

  {% for product in site.products %}
    {% if product.status != "✅" %}
      <tr>
        <td><a href="{{ product.id}}">{{ product.api-id}}</a></td>
        <td>{{ product.description }}</td>
        <td>{{ product.standard_report }}</td>
        <td>{{ product.premium_report }}</td>
        <td>{{ product.standard_pdf }}</td>
        <td>{{ product.premium_pdf }}</td>
        <td>{{ product.white_label }}</td>
      </tr>
    {% endif %}
  {% endfor %}
</table>
> <small>✅ = Available
  ❌ = Not Available
  🚧 = Under construction / will be available</small>
