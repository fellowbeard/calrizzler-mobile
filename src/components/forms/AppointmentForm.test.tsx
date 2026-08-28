import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AppointmentForm } from "./AppointmentForm";

describe("AppointmentForm", () => {
  it("calculates service duration and submits appointment values", async () => {
    const onSubmit = jest.fn();
    const onNewClient = jest.fn();

    const { getByRole, getByText } = await render(
      <AppointmentForm
        timezone="America/New_York"
        initialClientId="1"
        initialValues={{
          id: 20,
          user_id: 10,
          client_id: 1,
          resource_id: 3,
          client: { id: 1, first_name: "Jane", last_name: "Doe" },
          resource: { id: 3, name: "Room A" },
          scheduled_at: "2026-01-15T02:30:00Z",
          status: "scheduled",
          duration_minutes: 0,
          duration_overridden: false,
          blocking_reservation_time: "0",
          uses_default_duration: false,
          services: [],
        }}
        clients={[
          {
            id: 1,
            user_id: 10,
            first_name: "Jane",
            last_name: "Doe",
            email: "jane@example.com",
            phone: null,
          },
        ]}
        resources={[{ id: 3, name: "Room A" }]}
        services={[
          {
            id: 2,
            user_id: 10,
            title: "Consultation",
            price: 100,
            duration_minutes: 45,
            description: null,
          },
        ]}
        submitLabel="Create Appointment"
        isSaving={false}
        onNewClient={onNewClient}
        onSubmit={onSubmit}
      />
    );

    fireEvent.press(getByRole("button", { name: /Consultation/ }));

    await waitFor(() => expect(getByText("Total time: 45 min")).toBeTruthy());

    fireEvent.press(getByRole("button", { name: "Create Appointment" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 1,
        resource_id: 3,
        duration_minutes: 45,
        duration_overridden: false,
        service_ids: [2],
        status: "scheduled",
        scheduled_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
      })
    );
    expect(onNewClient).not.toHaveBeenCalled();
  });
});
