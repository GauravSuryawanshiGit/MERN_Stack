(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })()
    // ... (Razorpay initialization code)

 async(response)=>{
  try {
      const res = await fetch('/payment/success', {  // Sending data to /payment/success
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(response) // Sending the Razorpay response
      });

      const data = await res.json();  // Get the response from your server

      if (data.status === 'success') {
          alert("Payment Successful!");
          // Redirect or update UI as needed
      } else {
          console.error("Payment failed on server:", data.message);
          alert("Payment failed. Please try again.");
      }

  } catch (err) {
      console.error("Error sending payment confirmation to server:", err);
      alert("An error occurred. Please try again later.");
  }
}

// ... (rest of your client-side code)