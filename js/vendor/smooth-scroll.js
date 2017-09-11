
// Add smooth scrolling to all links
$("a").on('click', function(event) {

  // Make sure this.hash has a value before overriding default behavior
  if (this.hash !== "") {
    // Prevent default anchor click behavior
    event.preventDefault();

    // Store hash
    var hash = this.hash;

    // Unhide the section we're traveling to
    $(hash).removeClass("hidden");

    // Using jQuery's animate() method to add smooth page scroll
    // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
    $('html, body').animate({
      scrollTop: $(hash).offset().top
    }, 800, function(){

      // Add hash (#) to URL when done scrolling (default click behavior)
      window.location.hash = hash;
    });
  } // End if
});


// Similar to above, but this scrolls to a specific section programatically based on form responses
function scrollTo(location) {
  var hash = location;
  $(hash).removeClass("hidden");
  $('html, body').animate({scrollTop: $(hash).offset().top}, 800, function(){
    window.location.hash = hash;
  });
}