#### Overview

* [Basics](#basic-usage)
* [Options](#options)
* [Listeners](#listeners)
* [Events](#trigger-events)
* [JSON envelope](#json-envelope)

#### Dependencies
* [Handlebars.js](http://handlebarsjs.com/) for templates. 

## Basic usage
```html
<!-- Form -->
<form action="/posts/search" id="PostsSearch">
    <input type="hidden" name="page" value="1" id="current_page">
    <!-- Add any  -->
    <input type="submit">Get posts</input>
</form>

<!-- Target -->
<ul id="results"></ul>

<!-- Template -->
<script id="myTemplate" type="text/x-handlebars-template">
  {{#each results}}
    <li id="post-{{Post.id}}">
      <h3>{{Post.headline}}</h3>
      <p>{{Post.intro}}</p>
      <a href="/posts/view/{{Post.id}}"
    </li>
  {{/each}}
</script>​
```

```js
// Run plugin
$('#PostsSearch').postAndProcess({
    target : '#results',
    template : '#myTemplate',
    paginationCounter : '#current_page'
});

Read more about the [expected JSON response](#json-envelope)


## Options
<dl>

    <dt>data <code>object : false</code></dt>
    <dd>Preload first set of results. Supply an object identical to what the first XHR request would respond with.</dd>

    <dt>target <code>string</code></dt>
    <dd>The selector of the DOM element you want the results placed in, ie <code>#results</code></dd>

    <dt>template <code>string|array|obj</code></dt>
    <dd>The id of <a href="http://handlebarsjs.com/">Handlebars.js</a> template to use. For multiple templates, try <code>template: [ '#myTemplate', '#anotherTemplate']</code>. See the <code>pop.changeTemplateId</code> event for more info.</dd>

    <dt>submitOnEvent <code>string : 'submit'</code></dt>
    <dd>Which events trigger a form submit. NB! <code>loadMore</code> is automatically added as an event</dd>

    <dt>paginationCounter <code>string</code></dt>
    <dd>Selector of the input that holds the page counter</dd>

    <dt>spinner <code>string : '.spinner'</code></dt>
    <dd>Selector for spinner/loader. Automatically fades in/out on XHR activity.</dd>

    <dt>infiniteScroll <code>bool : false</code></dt>
    <dd>Continue loading more results when scrolling to bottom of <code>options.target</code>? Particularly useful with results containers that have scrolling</dd>

    <dt>noResultsMessage <code>string : 'No results found'</code></dt>
    <dd>If no results are found, show this message</dd>

    <dt>noMoreResultsMessage <code>string : 'All records loaded.'</code></dt>
    <dd>If we've previously fetched results, but there are no more records, display this message</dd>

    <dt>domWrapIn <code>array : [ '&lt;li class="list-empty"&gt;', '&lt;/li&gt;' ]</code></dt>
    <dd>Wrapper around <code>noResultsMessage</code> and <code>noMoreResultsMessage</code>.</dd>

    <dt>onImageLoadEvent <code>boolean : false</code></dt>
    <dd>If true and <code>$.fn.imagesLoaded</code> is present, it will trigger <code>pop.imagesLoaded</code> event once all images have been downloaded</dd>

</dl>

NB: You can set the options on the ``` <form>``` with <code>data-</code> attributes, like this:

```html
<form data-target="#results" data-template="#myTemplate">
```

<hr>

## Listeners

<dl>
    <dt>pop.before <code>event, jqXHR, settings</code></dt>
    <dd>

        ```js
        // Set up listener
        $("#PostsSearch").on("pop.before", function(event, jqXHR, settings) {
            // this is triggered from $.ajax' beforeSend
            console.log(jqXHR);
            console.log(settings);
        });
        ```

    </dd>

    <dt>pop.done <code>event, data</code></dt>
    <dd>

        ```js
        // Set up listener
        $("#PostsSearch").on("pop.done", function(event, data) {
            console.log(data); // this holds the ajax response!
        });
        ```
    </dd>

    <dt>pop.emptyResponse <code>event, message, data</code></dt>
    <dd>

        ```js
        // When data.results is empty.
        $("#PostsSearch").on("pop.emptyResponse", function(event, message, data) {
            console.log(message);
            console.log(data); //
        });
        ```
    </dd>

</dl>

<hr>

## Trigger Events
<dl>
    <dt>pop.useTemplateId <code>[ '#myTemplate' ]</code></dt>
    <dd>
        Change the template 

        ```js
        // Change template by #template-id
        $("#PostsSearch").trigger("pop.useTemplateId", ['#myTemplate']);

        // ..or by index:
        $("#PostsSearch").trigger("pop.useTemplateId", [ 0 ]);
        ```

        See <code>options.template</code>for more info.
    </dd>

    <dt>loadMore</dt>
    <dd>POSTs the form and appends the result to the <code>options.target</code> container.
        ```js
        // Use like this
        $("#PostsSearch").trigger("loadMore");
        ```

    </dd>
</dl>

<hr>

## JSON envelope

postAndProcess is opinionated when it comes to the JSON response. It requires these keys:

<dl>
  <dt>data.results</dt>
  <dd>The results key contains the requested data.</dd>

  <dt>data.status</dt>
  <dd>
      The status key is used to communicate extra information about the response to the developer.
      <code>status.page</code> and <code>status.results_count</code> are required for $.postAndProcess to function properly.
  </dd>
</dl>

```js
// Sample:
{
  results: [
    {
      'User' : {
        id: "3",
        name: "Dr. Zoidberg",
        bio: "Why not zoidberg?",
        email: "zoidberg@whoopwhooop.com",
      }
    }
    // .. etc...
  ],
  status: {
    page: 1,
    results_count: 40,
    total_count: 271,
    limit : 40
  }
}
```

## Handlebars sample

```
<script id="hb-user-search-results" type="text/x-handlebars-template">
{{#each results}}
<li id="user-{{User.id}}">

  <a href="<?php echo $editUrl; ?>/{{id}}/target:user-{{User.id}}/hbTemplate:hb-user-search-results" class="js-edit">

      <div class="list-thumbnail">
          <img src="<?php echo $thumbnailUrl; ?>/{{User.Attachment.0.id}}/150/150"> 
      </div>

      <div class="list-primary-info">
        {{User.name}}
      </div>

      <div class="list-extended-info">
        {{User.email}}, {{User.phone}}, <!-- etc -->
      </div>
  </a>
</li>
{{/each}}
</script>​
```


## CakeController sample
```php
<?php
  public function search() {

    // Build query
    $page = 1;
    $limit = 40;
    if ($this->request->is('post') && isset($this->data['Search']['page'])) {
      $page = $this->request->data['Search']['page'];
      // etc..
    }

    // Conditions
    $conditions = array();

    // Results
    $response['results'] = $this->YourModel->find('all', array(
      'limit' => $limit,
      'offset' => ($page - 1) * $limit,
      'conditions'=>$conditions
      ));

    // Status
    $response['status']['page'] = $page;

    $response['status']['results_count'] = count($response['results']);

    $response['status']['total_count'] = $this->YourModel->find('count', array(
      'conditions'=> $conditions
      ));

    // Send data to view
    $this->set('results', $response);

    // Respond with JSON
    $this->RequestHandler->respondAs('json');
    $this->RequestHandler->renderAs($this, 'json');
    $this->set('_serialize', 'results');     

  }
?>
```
