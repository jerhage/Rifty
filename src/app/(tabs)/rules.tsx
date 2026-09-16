import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CoreRulesData } from "@/features/rules/presentation/data/core-rules-data";
import { CoreRulesScreen } from "@/features/rules/presentation/screens/core-rules-screen";

function RulesRoute() {
  const { rules } = useAppDependencies();

  return (
    <CoreRulesData
      coreRuleLister={rules.coreRulesRepository}
      coreRulesEditionFinder={rules.coreRulesRepository}
    >
      {({ coreRules, edition }) => <CoreRulesScreen coreRules={coreRules} edition={edition} />}
    </CoreRulesData>
  );
}

export default RulesRoute;
