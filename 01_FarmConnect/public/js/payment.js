document.addEventListener("DOMContentLoaded", function () {
    const payNowBtn = document.getElementById("pay-now");

    if (!payNowBtn) {
        console.error("Pay Now button not found!");
        return;
    }

    payNowBtn.addEventListener("click", function () {
        const amount = payNowBtn.getAttribute("data-amount"); // Get total amount

        if (!amount || isNaN(amount)) {
            alert("Invalid amount! Please check your cart.");
            return;
        }

        fetch("/order/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: amount })
        })
        .then(response => response.json())
        .then(order => {
            if (!order || !order.id) {
                alert("Error creating order. Try again!");
                return;
            }

            var options = {
                "key": "YOUR_RAZORPAY_KEY",  // Replace with your Razorpay Key
                "amount": order.amount,
                "currency": "INR",
                "name": "Vegetable Store",
                "description": "Order Payment",
                "order_id": order.id,
                "handler": function (response) {
                    fetch("/order/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            order_id: order.id,
                            payment_id: response.razorpay_payment_id,
                            signature: response.razorpay_signature
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            window.location.href = "/order/success"; // Redirect to success page
                        } else {
                            alert("Payment verification failed!");
                        }
                    });
                },
                "prefill": {
                    "name": "Customer Name",
                    "email": "customer@example.com",
                    "contact": "9876543210"
                },
                "theme": { "color": "#28a745" }
            };

            var rzp1 = new Razorpay(options);
            rzp1.open();
        })
        .catch(error => console.error("Error:", error));
    });
});
