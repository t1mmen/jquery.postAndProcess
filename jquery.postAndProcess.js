/**
 * jquery.postAndProcess.js
 * @link: https://github.com/t1mmen/jquery.postAndProcess
 * @author: Timm Stokke <timm@stokke.me>
 */
$.fn.postAndProcess = function(options) {
   "use strict";

	return this.each(function(i, el) {

		// Cache selectors
		var base = el,
			$base = $(el);

		// Defaults
		var defaults = {
			data : false,
			template : false, // #myTemplate or { '#tmpl1', '#otherTmpl' }
			submitOnEvent : 'submit', // space between event names
			target : false, // #myTarget
			spinner : false, // #spinner
			infiniteScroll : false,
			paginationCounter : false,
			onLoadSubmit : true,
			domWrapIn : [ '<li class="list-empty">', '</li>' ],
			noResultsMessage : 'Sorry, nothing matches these criterias.',
			noMoreResultsMessage : 'All records loaded.'
		};

		// Build options based on data-*, then passed options, then defaults
		options = $.extend( {}, defaults, options, $base.data()) ;

		// More cached selectors
		var	$spinner = $(options.spinner),
			$paginationCounter = $(options.paginationCounter),
			$target = $(options.target);

		// Init
		// -----------------
		base.init = function() {

			// Compile templates (from options.template)
			var templates = base.prepTemplates();

			// Set status as data-*
			$base.data('pop.fetchedResults', 0);
			$base.data('pop.loadMoreResults', true);

			// Register append to results event
			options.submitOnEvent = options.submitOnEvent + " loadMore";

			// Bind form to events (options.submitOnEvent)
			$base.on(options.submitOnEvent, function(event, params) {

				// If the form target is _blank, don't do AJAX things:
				if ($base.attr('target') == '_blank') {
					return true;
				}

				event.preventDefault();

				// Make sure we only have one request at a time:
				if (typeof requestData !== 'undefined') {
					requestData.abort();
				}

				// Not appending results? Reset all the things
				if (event.type !== "loadMore") {

					// If params.page_num is set, use that:
					if (typeof params !== 'undefined') {
						$paginationCounter.val(params.page_num);

					// If not, reset counter:
					} else {
						$paginationCounter.val(1);
					}

					$base.data('pop.fetchedResults', 0);
					$base.data('pop.loadMoreResults', true);
				}

				// Are we loading (more) results?
				if ($base.data("pop.loadMoreResults") === true) {
					var requestData = base.getData();

				// If not, abort:
				} else {
					return false;
				}

				// We have data (either though AJAX request, or options.data)
				// ----------------------
				$.when(requestData).then(function(data, textStatus, jqXHR) {

					// Hide spinner and .loading class on target
					$spinner.fadeOut(600);
					$target.removeClass("loading");

					// Keep tabs on how many results we got, etc
					var previouslyFetchedResults = $base.data("pop.fetchedResults");
					var	currentFetchedResults = previouslyFetchedResults + data.results.length;
					$base.data("pop.fetchedResults", currentFetchedResults);

					// If we have found all results, make a note to stop pulling
					if ( data.status.total_count === currentFetchedResults || data.results.length === 0) {
						$base.data("pop.loadMoreResults", false);
					}

					// Event: Search has returned valid response
					$base.trigger("pop.done", [ data, textStatus, jqXHR ]);

					// No results? Deal with it:
					if ( data.results.length === 0) {
						base.handleEmptyResponse(event, data);

					// If templates are OK, and response is JSON
					} else if (templates !== false && typeof data === 'object') {

						// Compile template & data
						var templateId = $base.data("pop.templateId");
						var result = templates[templateId](data);

						// Insert to DOM
						if (event.type === "loadMore") {

							// Visible height + total height
							var targetHeight = $target.height(),
								targetScrollHeight = $target[0].scrollHeight;

							// Append results and scroll down about 50% of the window height.
							$target
								.append(result)
								.stop()
								.animate({
									scrollTop: targetScrollHeight - targetHeight/2
								}, 400);

						} else {
							$target.html(result);
						}

						// Event: Results rendered to screen
						$base.trigger("pop.rendered");

					}

				});

			});

			// Init infinite scroll
			if (options.infiniteScroll === true) {
				base.enableInfiniteScroll();
			}

			// Register additional hooks
			base.registerEvents();

			// Autorun request?
			if (options.onLoadSubmit) {
				$base.trigger("submit");
			}

			// @todo make this work so I can do $('#formId').done()...
			if (typeof dataRequest !== 'undefined') {
				return dataRequest;
			}

		};

		// Get data via ajax or options.data
		// ---------------------------------
		base.getData = function() {

			// Use local data for initial load
			if (typeof options.data === 'object' && $base.data('pop.fetchedResults') === 0) {

				// Fire event and return the data
				$base.trigger("pop.before");
				return options.data;

			// Get data via AJAX:
			} else {

				return $.ajax({
					url: $base.attr('action'),
					type : $base.attr('method'),
					dataType : "json",
					data: $base.serialize(),
					beforeSend : function(jqXHR, settings) {

						// @todo pass along var formData here too?
						$base.trigger("pop.before", [ jqXHR, settings ]);

						// Show spinner & .loading class
						$spinner.fadeIn(100);
						$target.addClass("loading");

					}
				});
			}

		};

		// No data.results returned?
		// -------------------------
		base.handleEmptyResponse = function(event, data) {

			var message;

			// Do we have a message from the API?
			if (typeof data.status.message !== 'undefined') {
				message = data.status.message;

			// If we have loaded some data, but no new results
			} else if ($base.data("pop.loadMoreResults") === false && $base.data("pop.fetchedResults") > 0) {

				message = options.noMoreResultsMessage;

			// If not, use specified (or default) message
			} else {
				message = options.noResultsMessage;
			}

			// Append no/no more results message to $target.
			var emptyResponseDom = options.domWrapIn[0] + message + options.domWrapIn[1];

			if (event.type !== "loadMore") {
				$target.html(emptyResponseDom);
			}

			// Trigger event:
			$base.trigger('pop.emptyResponse', [message, data]);

		};

		// Compile the (handlebars) templates
		// ----------------------------------
		base.prepTemplates = function() {

			if (options.template === false) {
				return false;
			}

			var templates = [];

			if (typeof options.template === 'string') {
				options.template = [ options.template ];
			}

			// Compile templates, availiable later as templates['#handlebars-id']..
			$.each(options.template, function(index, value) {
				templates[value] = Handlebars.compile( $(value).html() );
			});

			// Remember the template used (defaults to first in array)
			$base.data('pop.templateId', options.template[0]);

			return templates;
		};

		// Changes template used to render results
		// Change with $(..).trigger("template.change", [ '#handlebars-id' ])
		base.setTemplate = function(templateId) {

			// Did we get #handlebars-id or index?
			if (typeof templateId === 'string') {
				$base.data('pop.templateId', templateId);
			} else {
				$base.data('pop.templateId', options.template[templateId]);
			}

		};

		// Enable Infinite scrolling (autoload results when reaching bottom)
		// @dependency debounce
		base.enableInfiniteScroll = function() {
			if (!$.isFunction($.fn.debounce)) {
				$.error('Debounce plugin isn\'t loaded');
				return false;
			}

			// Register debounce
			$target.debounce("scroll", function() {

				// Abort auto-search when scroll triggers on view switching.
				if ( $target.outerHeight() === 0 ) {
					return false;
				}

				// When we reach the bottom
				if ( ($target[0].scrollHeight - $target.scrollTop()) === $target.outerHeight() ) {

					// Update page number
					var currentPageNumber = $paginationCounter.val();
					$paginationCounter.val( parseInt(currentPageNumber) + 1 );

					// Run search
					$base.trigger('loadMore');
				}
			}, 300);

		};

		// Event handeling
		// Trigger these by $('#formId').trigger("eventName", [ 'param1', 'param2 ']);
		base.registerEvents = function() {

			// PS: 'submit' (replaces results) & 'loadMore' (appends) are already registered.

			// Set template used for next response.
			$base.on('pop.useTemplateId', function(e, template) {
				base.setTemplate(template);
			});

		};

		// Init call
		return base.init();

	});

};
