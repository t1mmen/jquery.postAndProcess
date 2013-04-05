#### Overview

* [Basics](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#basic-usage)
* [Options](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#options)
* [Listeners](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#listeners)
* [Events](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#trigger-events)
* [Helper options](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#helper-options)
* [Sample: Controller](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#controller-sample)
* [Sample: Response](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#response-sample)
* [Sample: View/Using the Helper](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#view-sample)

#### Integrates with:
* [FormHelper::create](https://github.com/wearecolours/colourscms/wiki/FormHelper::create)

#### Dependencies
* [Handlebars.js](http://handlebarsjs.com/) for templates. Read more about [templating here](http://handlebarsjs.com/).
* [ImagesLoaded.js](https://github.com/desandro/imagesloaded) (Optional – required for <code>pop.imagesLoaded</code> event)

## Basic usage
```html
<!-- Form -->
<form action="/Posts/search" id="PostsSearch">
    <!-- inputs, etc here... -->
    <input type="submit">Get posts</input>
</form>

<!-- Target -->
<ul id="results"></ul>
```

```js
// Run plugin
$('#PostsSearch').postAndProcess({
    target : '#results',
    template : '#myTemplate'
});
```
See the more details [walkthrough here](https://github.com/wearecolours/colourscms/wiki/Js.postAndProcess#walkthough) (build the JSON response, templates, etc.)

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


    <dt>pop.imagesLoaded <code>event, numTotal, numProper, numBroken</code></dt>
    <dd>
        This event only triggers if [desandro's imagesLoaded](https://github.com/desandro/imagesloaded) plugin is loaded.
        
        ```js
        // Set up listener
        $("#PostsSearch").on("pop.imagesLoaded", function(event, numTotal, numProper, numBroken) {
            console.log(numTotal + " images have been fully loaded");
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

# Walkthough


## Controller sample
```php
<?php
  public function search($limit = 40) {

    // Talk in JSON
    $this->RequestHandler->respondAs('json');
    $this->RequestHandler->renderAs($this, 'json');

    // Search criterias. Expand with yours here:
    // NB: SearchComponent takes care of Search.q fulltext searches in all joined tables
    $page = 1;
    if ($this->request->is('post') && isset($this->data['Search']['page'])) {
      $page = $this->request->data['Search']['page'];
    }

    // Conditions
    $site = Configure::read('current_site');
    $siteConditions = array('User.site_id'=>am($site['Site']['id'], Set::extract('/Import/id',$site)));
    $conditions = $this->Search->conditions($siteConditions);  

    // Results
    $response['results'] = $this->User->find('all', array(
      'order' => 'User.name ASC',
      'limit' => $limit,
      'offset' => ($page - 1) * $limit,
      'conditions'=>$conditions['conditions']
      ));

    // Status
    $response['status']['page'] = $page;

    $response['status']['results_count'] = count($response['results']);

    $response['status']['total_count'] = $this->User->find('count', array(
      'conditions'=> $siteConditions
      ));

    // Send data to view
    $this->set('results', $response);

    // This uses a common JSON view. 
    // Remove this to make your own view
    $this->set('_serialize', 'results'); 
  }
?>
```


## Response Sample

JSON envelope contains two keys:

<dl>
  <dt>data.results</dt>
  <dd>The results key is where you'll find the data you requested.</dd>

  <dt>data.status</dt>
  <dd>
      The status key is used to communicate extra information about the response to the developer.
      <code>status.page</code> and <code>status.results_count</code> are required for $.postAndProcess to function properly.
  </dd>
</dl>


```js
// This ends up looking something like this:
{
  results: [
    {
      'User' : {
        id: "3",
        name: "Dr. Zoidberg",
        description: "Why not zoidberg?",
        email: "zoidberg@futurama.com",
        phone: "555-44-333",
        created: "2012-08-13 17:55:59",
        modified: "2013-03-26 19:27:34",
        creator: "63",
        modifier: "2",
        site_id: "18"
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

## View sample
Remember, an id must be unique in the DOM.

```php
<?php
// Multiple template support
$popOptions = array(
  'hbTemplate' => 'user/hb-user-search-results', // Cake element
  'hbSelector' => '#hb-user-search-results', // id of template
  'loadMore' => '#js-load-more-results', // This selector will trigger load + append
  'target' => '#user-results-container', // where to place the result
  'spinner' => '#user-spinner',
  );

$formOptions = array('id' => 'UserForm');

echo $this->Form->postAndProcess('User', $formOptions, $popOptions);
echo $this->Form->input('Search.q', array('class' => 'search-query'));
echo $this->Form->end('Search');
?>
```
```html

<h3>
    Search results 
    <div id="user-spinner"><i class="icon-spinner icon-spin icon-2x"></i></div>
</h3>

<ul class="cms-list" id="user-results-container">
    <!-- Results will show up here -->
</ul>

<div id="js-load-more-results" class="btn">Load more results</div>
```

## Handlebars sample
/App/View/Elements/user/hb-user-search-results.ctp
```php
<?php
// Prep URLs
$thumbnailUrl = $this->Html->url(array('controller'=>'file_files','action'=>'thumbnail',
                        'modal'=>false,'plugin'=>false,'admin'=>false));
$editUrl = $this->Html->url(array('controller' => 'users', 'action' => 'edit','modal'=>true,'plugin'=>false,'admin'=>false));
$deleteUrl = 'etc';
$viewUrl = 'etc';
?>
```
```
<script id="hb-user-search-results" type="text/x-handlebars-template">
{{#each results}}
<li id="user-{{User.id}}"> <!-- Notice we also pass this as GET.target -->

  <div class="list-controls">
    <a href="<?php echo $viewUrl; ?>/{{User.id}}/target:user-{{User.id}}/hbTemplate:hb-user-search-results" class="js-view"><i class="icon-eye-open"></i></a>
    <a href="<?php echo $editUrl; ?>/{{User.id}}" class="js-edit"><i class="icon-wrench"></i></a>
    <a href="<?php echo $deleteUrl; ?>/{{User.id}}" class="js-delete control-danger"><i class="icon-trash"></i></a>
  </div>

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

#### A note on <code>target</code> & <code>hbTemplate</code> params
In the handlebars template above, we pass <code>target</code> and <code>hbTemplate</code> as params to the <code>UsersController::edit</code> action. We can use these with <code>[FormHelper::create](https://github.com/wearecolours/colourscms/wiki/FormHelper::create)</code> to update a row with new data:

```
<?php
// Set options (notice we add the # prefix here)
$hfOptions['target'] = '#'.$this->params['named']['target'];
$hfOptions['hbTemplate'] = '#'.$this->params['named']['hbTemplate'];

// If this were /add, we might do this too:
// $hfOptions['replaceMethod'] = 'append' // default is 'replaceWith'

echo $this->Form->create('User', $formOptions, $hfOptions);
?>
```
Of course, this requires that <code>Form::create</code> responds the same way as User::search

See more [FormHelper::create](https://github.com/wearecolours/colourscms/wiki/FormHelper::create) docs for more info.


## Javascript snippets

You'll probably want to bind links. This is a good way to do that:

```js
// Bind to the same as <code>options.target</code>
$('#user-results-container').on('click', 'a', function(e){
  e.preventDefault();

  var $this = $(this),
      href = $this.attr('href');

  // Do something special on delete
  if ($this.hasClass("js-delete")) {

  } else {
    // so something else
  }

})
```
