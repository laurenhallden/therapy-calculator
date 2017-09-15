
// Add smooth scrolling to all button links
$("a").on('click', function(event) {
  var start = $(this).closest('section').attr('id');
  window.start = start;

  // Make sure this.hash has a value before overriding default behavior
  if (this.hash !== "") {
    // Prevent default anchor click behavior
    event.preventDefault();

    // Store hash
    var hash = this.hash;
    var heading = $(hash).find('h2');

    // Loop through subsequent section and hide them, in case the user is starting over and changing stuff
    var currentSection = $("body").find('#' + start);
    $(currentSection).nextAll().addClass('hidden');

    // Then unhide the section we're going to
    $(hash).removeClass("hidden");

    // Using jQuery's animate() method to add smooth page scroll
    // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
    $('html, body').animate({
      scrollTop: $(heading).offset().top
    }, 800, function(){

      // Add hash (#) to URL when done scrolling (default click behavior)
      window.location.hash = hash;
    });
  } // End if
});


// Similar to above, but this scrolls to a specific section programatically based on form responses
function scrollTo(end) {
  var hash = end;
  var heading = $(hash).find('h2');

  // Loop through subsequent section and hide them, in case the user is starting over and changing stuff
  var currentSection = $("body").find('#' + start);
  $(currentSection).nextAll().addClass('hidden');

  // Then unhide the section we're going to
  $(hash).removeClass("hidden");
  $('html, body').animate({scrollTop: $(heading).offset().top}, 800, function(){
    window.location.hash = hash;
  });
}