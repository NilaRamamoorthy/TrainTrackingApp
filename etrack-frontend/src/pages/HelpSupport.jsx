import { useNavigate } from "react-router-dom";

export default function HelpSupport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <button
          className="text-primary text-lg font-medium"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-chevron-left" /> Help & Support
        </button>
      </div>

      {/* Content */}
      <div className="px-5 m-4 space-y-8 text-sm">

        {/* FAQ Section */}
        <div>
          <div className="text-base font-semibold text-gray-800 mb-4">
            Frequently Asked Questions
          </div>

          <div className="space-y-5 text-gray-600">

            <div>
              <div className="font-semibold text-gray-700">
                1. How to book tickets?
              </div>
              <div className="mt-1">
                Go to the Schedule section from Home, select your departure 
                and destination stations, choose a date, and select an available train. 
                Complete the booking by confirming passenger details and payment.
              </div>
            </div>

            <div>
              <div className="font-semibold text-gray-700">
                2. How to cancel a parcel?
              </div>
              <div className="mt-1">
                Open the Parcels page from Home, select the parcel booking, 
                and tap the Cancel button. Cancellation is allowed only before departure.
              </div>
            </div>

            <div>
              <div className="font-semibold text-gray-700">
                3. How to track a train?
              </div>
              <div className="mt-1">
                After booking, open your ticket or parcel details to view 
                real-time status updates such as Booked, Departed, and Delivered.
              </div>
            </div>

            <div>
              <div className="font-semibold text-gray-700">
                4. When will I receive notifications?
              </div>
              <div className="mt-1">
                You will receive reminders 1 day before journey and 1 hour 
                before departure. Additional updates will be sent when your 
                train or parcel departs and reaches the destination.
              </div>
            </div>

          </div>
        </div>

        {/* Contact Section */}
        <div>
          <div className="text-base font-semibold text-gray-800 mb-3">
            Contact Support
          </div>
          <div className="text-gray-600">
            Email: support@etrack.com <br />
            Phone: +91 90000 00000 <br />
            Available: 24/7 Customer Assistance
          </div>
        </div>

      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}