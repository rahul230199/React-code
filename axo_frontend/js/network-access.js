/****************************************************
 * AXO NETWORKS – NETWORK ACCESS FORM JS
 * FINAL FIXED VERSION
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
           COLLECT VALUES
        ================================ */

        const whatYouDo = Array.from(
            form.querySelectorAll('input[name="whatYouDo"]:checked')
        ).map(c => c.value);

        const roleInEV = form.querySelector(
            'input[name="roleInEV"]:checked'
        )?.value;

        const payload = {
            company_name: document.getElementById("companyName")?.value.trim(),
            website: document.getElementById("website")?.value.trim() || null,
            registered_address: document.getElementById("registeredAddress")?.value.trim() || null,
            city_state: document.getElementById("cityState")?.value.trim(),
            contact_name: document.getElementById("contactName")?.value.trim(),

            // IMPORTANT: This must be buyer / supplier / oem
            role_requested: document.getElementById("role")?.value.trim().toLowerCase(),

            email: document.getElementById("email")?.value.trim(),
            phone: document.getElementById("phone")?.value.trim(),

            what_you_do: whatYouDo,

            primary_product: document.getElementById("primaryProduct")?.value.trim(),
            key_components: document.getElementById("keyComponents")?.value.trim(),
            manufacturing_locations: document.getElementById("manufacturingLocations")?.value.trim(),
            monthly_capacity: document.getElementById("monthlyCapacity")?.value.trim(),

            certifications: document.getElementById("certifications")?.value.trim() || null,
            role_in_ev: roleInEV,
            why_join_axo: document.getElementById("whyJoinAXO")?.value.trim(),
        };

        /* ===============================
           REQUIRED FIELD CHECK (FIXED)
        ================================ */

        for (const key of [
            "company_name",
            "city_state",
            "contact_name",
            "role_requested",
            "email",
            "phone",
            "primary_product",
            "key_components",
            "manufacturing_locations",
            "monthly_capacity",
            "role_in_ev",
            "why_join_axo"
        ]) {
            if (!payload[key]) {
                showError("Please fill all required fields");
                return;
            }
        }

        if (whatYouDo.length === 0) {
            showError("Please select at least one option for 'What do you do'");
            return;
        }

        /* ===============================
           SUBMIT TO BACKEND
        ================================ */

        try {
            form.style.display = "none";

            const res = await fetch("/api/network/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const text = await res.text();
            let json;

            try {
                json = JSON.parse(text);
            } catch {
                throw new Error("Server returned invalid response");
            }

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Submission failed");
            }

            showSuccess();

        } catch (err) {
            console.error("Submission error:", err);
            form.style.display = "block";
            showError(err.message || "Submission failed. Please try again.");
        }
    });
});

