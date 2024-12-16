import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaExternalLinkAlt } from "../SVG/index";

const PopUp = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notifySuccess = (msg) => toast.success(msg, { duration: 2000 });
  const notifyError = (msg) => toast.error(msg, { duration: 2000 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you can add your own newsletter subscription logic
      // For now, just showing success message
      notifySuccess("Thanks for subscribing!");
      setEmail("");
    } catch (error) {
      notifyError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade popup"
      id="popup_bid"
      tabIndex={-1}
      role="dialog"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <button
            type="button"
            className="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
          <form className="modal-body" onSubmit={handleSubmit}>
            <div className="image">
              <img src="assets/images/backgroup-section/popup.png" alt="" />
            </div>
            <div className="logo-rotate">
              <img
                src="logo.png"
                style={{
                  width: "60px",
                  height: "auto",
                }}
              />
            </div>
            <h2>Subscribe to our newsletter</h2>
            <p>Subscribe for our newsletter to stay in the loop</p>
            <fieldset className="email">
              <input
                className="style-1"
                placeholder="Email address*"
                tabIndex={2}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-required="true"
                required
                type="email"
                id="email"
                name="email"
              />
            </fieldset>
            <div className="button_container_NEWLATER">
              <button
                type="submit"
                disabled={isSubmitting}
                className="tf-button style-2 h50 w190 mr-30"
              >
                Subscribe
                <FaExternalLinkAlt />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PopUp;
