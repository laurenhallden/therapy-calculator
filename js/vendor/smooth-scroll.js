function scrollTo(end){
  hash = end;

  // Make sure this.hash has a value before overriding default behavior
  if (hash !== "") {

    // Store hash
    var hash = hash;
    var heading = $(hash).find('h2');

    var currentSection = $("body").find('#' + start);
    $(currentSection).nextAll().addClass('hidden');
    $(hash).removeClass('hidden');

    // Using jQuery's animate() method to add smooth page scroll
    // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
    $('html, body').animate({
      scrollTop: $(heading).offset().top
    }, 800, function(){

      // disable buttons and forms after they're clicked
      var allButtons = $('.button');
      var allForms = $('form');
      $(currentSection).find(allButtons).addClass('disabled');
      $(currentSection).find(allButtons).attr("disabled", "disabled");
      $(currentSection).find(allForms).removeAttr('data-abide');
 
      // Add hash (#) to URL when done scrolling (default click behavior)
      window.location.hash = hash;
    });
  } // End if
};

// I want to stop buttons that are just links from scrolling, but this doesn't seem to work
$('.disabled').click(function(e){
  e.preventDefault();
  e.stopPropagation();
});