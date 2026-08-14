
document.addEventListener("DOMContentLoaded", function() {
    const elements = document.querySelectorAll(".text, .image");
    function checkScroll() {
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.75) {
                el.classList.add("show");
            }
        });
    }
    window.addEventListener("scroll", checkScroll);
    checkScroll(); // Run once in case already in view
});