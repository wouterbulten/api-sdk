---
layout: default
title: Getting status of a product
---

# Getting status of a product

Can be used to get the status of a product. Includes all associated reports and instruments.

## Request headers

```
GET /v2/product/{accessCode}/overview HTTP/1.1
HOST: api.123test.com
x-123test-apikey: {apiKey}
```

## Response

JSON message containing the following fields:

- `product_access_code`
- `reports`: List of reports with `type`, `access_code` and `complete` fields. `complete` indicates whether the report can be viewed.
- `instrument_runs`: List of instrument runs with status

## Example

Example for "Vitaliteitscheck":

```
GET /v2/product/2ef47266-3011-4907-b5a9-4017d75ed075/overview HTTP/1.1
HOST: api.123test.com
x-123test-apikey: ...
```

```json
{
  "product_access_code": "2ef47266-3011-4907-b5a9-4017d75ed075",
  "reports": [
    {
      "type": 1,
      "access_code": "ae928f71-92b0-4979-a7a2-5324ed874a3b",
      "complete": true
    }
  ],
  "instrument_runs": [
    {
      "access_code": "08ec9a96-8679-4fda-b4dd-608a76897676",
      "status": "ended-items",
      "name": "vitaliteit-nl_nl-1"
    },
    {
      "access_code": "fdfbbf0d-83ac-4d5f-8b27-b77178ef7446",
      "status": "ended-items",
      "name": "bravo-nl_nl-1"
    },
    {
      "access_code": "06cff1dc-3a43-4e13-9d3b-33c6bc01c645",
      "status": "ended-skipped",
      "name": "profilerwork-nl_nl-1"
    }
  ]
}
```
