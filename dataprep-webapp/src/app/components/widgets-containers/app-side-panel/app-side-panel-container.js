

 /*  ============================================================================

  Copyright (C) 2006-2016 Talend Inc. - www.talend.com

  This source code is available under agreement available at
  https://github.com/Talend/data-prep/blob/master/LICENSE

  You should have received a copy of the agreement
  along with this program; if not, write to Talend SA
  9 rue Pages 92150 Suresnes, France

  ============================================================================*/

import SidePanelCtrl from './app-side-panel-controller';

const SidePanelContainer = {
	template: `<pure-app-side-panel
		 	actions="$ctrl.actions"
			on-toggle-dock="$ctrl.toggle"
			docked="$ctrl.state.home.sidePanelDocked"
		/>`,
	controller: SidePanelCtrl,
};
export default SidePanelContainer;