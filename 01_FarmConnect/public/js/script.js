(() => {
  'use strict'


  const forms = document.querySelectorAll('.needs-validation')


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


async (response) => {
  try {
    const res = await fetch('/payment/success', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    });

    const data = await res.json();

    if (data.status === 'success') {
      alert("Payment Successful!");

    } else {
      console.error("Payment failed on server:", data.message);
      alert("Payment failed. Please try again.");
    }

  } catch (err) {
    console.error("Error sending payment confirmation to server:", err);
    alert("An error occurred. Please try again later.");
  }
}

