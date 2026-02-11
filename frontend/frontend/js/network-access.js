/****************************************************
 * AXO NETWORKS – NETWORK ACCESS FORM JS
 * SAFE VERSION (HTML/JSON PROOF)
 ****************************************************/

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("accessForm");
    if (!form) return;

    const successBox = document.getElementById("successMessage");
    const errorBox = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");

    function showError(message) {
        if (!errorBox || !errorText) return;
        errorText.textContent = message;
        errorBox.style.display = "block";
        setTimeout(() => {
            errorBox.style.display = "none";
        }, 4000);
    }

    function showSuccess() {
        if (!successBox) return;
        successBox.style.display = "block";
        setTimeout(() => {
            successBox.style.display = "none";
            form.style.display = "block";
            form.reset();
        }, 5000);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        /* ===============================
           VALIDATION
        ================================ */
        const whatYouDo = Array.from(
            form.querySelectorAll('input[name="whatYouDo"]:checked')
        ).map(c => c.value);

        if (whatYouDo.length === 0) {
            showError("Please select at least one option for 'What do you do'");
            return;
        }

        const roleInEV = form.querySelector('input[name="roleInEV"]:checked');
        if (!roleInEV) {
            showError("Please select your role in EV manufacturing");
            return;
        }

        /* ===============================
           BUILD PAYLOAD
        ================================ */
        const payload = {
            companyName: form.companyName.value.trim(),
            website: form.website.value.trim(),
            registeredAddress: form.registeredAddress.value.trim(),
            cityState: form.cityState.value.trim(),
            contactName: form.contactName.value.trim(),
            role: form.role.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            whatYouDo,
            primaryProduct: form.primaryProduct.value.trim(),
            keyComponents: form.keyComponents.value.trim(),
            manufacturingLocations: form.manufacturingLocations.value.trim(),
            monthlyCapacity: form.monthlyCapacity.value.trim(),
            certifications: form.certifications.value.trim(),
            roleInEV: roleInEV.value,
            whyJoinAXO: form.whyJoinAXO.value.trim()
        };

        /* ===============================
           REQUIRED FIELD CHECK
        ================================ */
        for (const key of [
            "companyName","cityState","contactName","role",
            "email","phone","primaryProduct",
            "keyComponents","manufacturingLocations",
            "monthlyCapacity","roleInEV","whyJoinAXO"
        ]) {
            if (!payload[key]) {
                showError("Please fill all required fields");
                return;
            }
        }

        /* ===============================
           SUBMIT TO BACKEND (SAFE)
        ================================ */
        try {
            form.style.display = "none";

            const res = await fetch("/api/network-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const text = await res.text(); // IMPORTANT

            let json;
            try {
                json = JSON.parse(text);
            } catch {
                throw new Error("Server returned invalid response");
            }

            if (!res.ok || !json.success) {
                throw new Error(json.error || "Submission failed");
            }

            showSuccess();

        } catch (err) {
            console.error("Submission error:", err);
            form.style.display = "block";
            showError(err.message || "Submission failed. Please try again.");
        }
    });
});

