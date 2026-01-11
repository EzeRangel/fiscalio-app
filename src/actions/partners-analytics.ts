"use server";

import {
  fetchBusinessPartnersWithAnalytics,
  fetchGlobalPartnerStats,
} from "@/data/businessPartners";
import { actionClient } from "@/lib/safe-action";
import { getActiveOrganizationId } from "@/lib/session";

export const getPartnersWithAnalytics = actionClient.action(async () => {
  const organizationId = await getActiveOrganizationId();
  return fetchBusinessPartnersWithAnalytics(organizationId);
});

export const getGlobalPartnerStats = actionClient.action(async () => {
  const organizationId = await getActiveOrganizationId();
  return fetchGlobalPartnerStats(organizationId);
});