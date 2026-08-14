emailjs.init("d20rUAh9-cEvLP_OJ"); 

document.getElementById("contact-form").addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent default form submission

        emailjs.send("service_z4mwj1e", "template_5poplw1", {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            message: document.getElementById("message").value
        })
        .then(response => {
            alert("Message sent successfully!");
            document.getElementById("contact-form").reset();
        })
        .catch(error => {
            alert("Error sending message. Try again!");
            console.error("EmailJS Error:", error);
        });
    });