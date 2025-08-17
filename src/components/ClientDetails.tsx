import React from "react";
import { useQuery } from "@tanstack/react-query";
import { client_detail } from "@/data/collections";
import { maskPhone, maskEmail } from "@/lib/redact";

interface ClientDetailsProps {
  client: { id: string; name: string; created_at: string };
  onClose: () => void;
}

export function ClientDetails({ client, onClose }: ClientDetailsProps) {
  const { data: fullClient, isLoading, error } = useQuery({
    queryKey: ["client_detail", client.id],
    queryFn: () => client_detail(client.id),
  });

  if (isLoading) return <div>Loading client details...</div>;
  if (error) return <div>Error loading client details</div>;
  if (!fullClient) return <div>Client not found</div>;

  return (
    <div className="space-y-4">
      <p><strong>WhatsApp:</strong> {fullClient.whatsapp ? maskPhone(fullClient.whatsapp) : "Not provided"}</p>
      <p><strong>Email:</strong> {fullClient.email ? maskEmail(fullClient.email) : "Not provided"}</p>
      <p><strong>GSTIN:</strong> {fullClient.gstin || "Not provided"}</p>
      <p><strong>UPI VPA:</strong> {fullClient.upi_vpa || "Not provided"}</p>
    </div>
  );
}