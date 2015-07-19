define({ "api": [  {    "type": "get",    "url": "/user/me",    "title": "Request Logged in user information",    "name": "GetUser",    "group": "User",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "<p>Number</p> ",            "optional": false,            "field": "id",            "description": "<p>Users unique ID.</p> "          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "<p>Object</p> ",            "optional": false,            "field": "User",            "description": "<p>object.</p> "          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"firstname\": \"John\",\n  \"lastname\": \"Doe\"\n}",          "type": "json"        }      ]    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "UserNotFound",            "description": "<p>The id of the User was not found.</p> "          }        ]      },      "examples": [        {          "title": "Error-Response:",          "content": "HTTP/1.1 404 Not Found\n{\n  \"error\": \"UserNotFound\"\n}",          "type": "json"        }      ]    },    "version": "0.0.0",    "filename": "server/controllers/user.controller.js",    "groupTitle": "User"  }] });