/****************************************************
 * AXO NETWORKS – NETWORK ACCESS FORM JS
 * FULLY FIXED • PRODUCTION SAFE • DB READY
 ****************************************************/

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("accessForm");
    if (!form) return;

    const successBox = document.getElementById("successMessage");
    const errorBox = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");

    const submitButton = form.querySelector("button[type='submit']");

    /* ===============================================
       UI HELPERS
    =============================================== */

    function showError(message) {
        if (!errorBox || !errorText) return;
        errorText.textContent = message;
        errorBox.style.display = "block";
        successBox.style.display = "none";

        setTimeout(() => {
            errorBox.style.display = "none";
        }, 4000);
    }

    function showSuccess() {
        if (!successBox) return;

        successBox.style.display = "block";
        errorBox.style.display = "none";
        form.reset();

        setTimeout(() => {
            successBox.style.display = "none";
        }, 5000);
    }

    function disableSubmit() {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = "<span>Submitting...</span>";
        }
    }

    function enableSubmit() {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML =
                "<span>Submit Request <i class='fas fa-arrow-right'></i></span>";
        }
    }

    /* ===============================================
       FORM SUBMIT
    =============================================== */

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        disableSubmit();

        /* ===============================
           COLLECT CHECKBOX VALUES
        =============================== */

        const whatYouDo = Array.from(
            form.querySelectorAll('input[name="whatYouDo"]:checked')
        ).map(el => el.value);

        if (whatYouDo.length === 0) {
            enableSubmit();
            return showError("Please select at least one option for 'What Do You Do'");
        }

        const roleInEVRadio = form.querySelector(
            'input[name="roleInEV"]:checked'
        );

        if (!roleInEVRadio) {
            enableSubmit();
            return showError("Please select your role in EV manufacturing");
        }

        /* ===============================
           BUILD PAYLOAD (MATCHES DB)
        =============================== */

        const payload = {
            companyName: form.companyName.value.trim(),
            website: form.website.value.trim(),
            registeredAddress: form.registeredAddress.value.trim(),
            cityState: form.cityState.value.trim(),
            contactName: form.contactName.value.trim(),
            role: form.role.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            whatYouDo: whatYouDo, // ARRAY (backend will store JSON)
            primaryProduct: form.primaryProduct.value.trim(),
            keyComponents: form.keyComponents.value.trim(),
            manufacturingLocations: form.manufacturingLocations.value.trim(),
            monthlyCapacity: form.monthlyCapacity.value.trim(),
            certifications: form.certifications.value.trim(),
            roleInEV: roleInEVRadio.value,
            whyJoinAXO: form.whyJoinAXO.value.trim()
        };

        /* ===============================
           REQUIRED FIELD CHECK
        =============================== */

        const requiredFields = [
            "companyName",
            "cityState",
            "contactName",
            "role",
            "email",
            "phone",
            "primaryProduct",
            "keyComponents",
            "manufacturingLocations",
            "monthlyCapacity",
            "roleInEV",
            "whyJoinAXO"
        ];

        for (let field of requiredFields) {
            if (!payload[field]) {
                enableSubmit();
                return showError("Please fill all required fields.");
            }
        }

        /* ===============================
           SEND TO BACKEND
        =============================== */

        try {

            const response = await fetch("/api/network-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Server returned invalid response.");
            }

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Submission failed.");
            }

            showSuccess();

        } catch (error) {
            console.error("Network Request Error:", error);
            showError(error.message || "Submission failed. Please try again.");
        } finally {
            enableSubmit();
        }

    });

});