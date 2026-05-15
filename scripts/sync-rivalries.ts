import { LeaderboardScope } from "@prisma/client";
import { syncRivalries } from "@/lib/rivalries";

async function main() {
  const scopes = [
    LeaderboardScope.OVERALL,
    LeaderboardScope.GROUP_STAGE,
    LeaderboardScope.KNOCKOUT
  ];

  for (const scope of scopes) {
    const rows = await syncRivalries(scope);
    console.log(`Rivalidades sincronizadas em ${scope}: ${rows.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
