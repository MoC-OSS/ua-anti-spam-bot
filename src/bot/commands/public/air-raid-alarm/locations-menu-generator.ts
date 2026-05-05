import type { MenuRange } from '@grammyjs/menu';

import { onlyAdmin } from '@bot/middleware/only-admin.middleware';

import { getAirRaidAlarmSettingsMessage } from '@message';

import { TEST_ALARM_REGION_ID, TEST_ALARM_REGION_NAME } from '@services/alarm.service';
import { alarmChatService } from '@services/alarm-chat.service';

import type { GrammyContext, GrammyMenuContext } from '@app-types/context';
import type { StfalconRegion } from '@app-types/stfalcon-alarm';

import { handleError } from '@utils/error-handler.util';
import { isIdWhitelisted } from '@utils/generic.util';

/** Test region used for development and whitelisted users. */
const TEST_REGION: StfalconRegion = {
  regionId: TEST_ALARM_REGION_ID,
  regionName: TEST_ALARM_REGION_NAME,
  regionType: 'State',
  regionChildIds: [],
};

const PAGE_SIZE = 10;

/**
 * Resolves the page index for pagination based on the currently selected region.
 * @param allRegions - all available regions
 * @param selectedRegionIds - currently selected regionIds from settings
 * @returns 1-based page index
 */
function resolvePageIndex(allRegions: StfalconRegion[], selectedRegionIds: string[]): number {
  if (selectedRegionIds.length === 0) {
    return 1;
  }

  const selectedIndex = allRegions.findIndex((region) => selectedRegionIds.includes(region.regionId));

  return Math.max(1, Math.ceil((selectedIndex + 1) / PAGE_SIZE));
}

/**
 * Generates a dynamic paginated location menu for air raid alert settings.
 * Displays a flat list of top-level regions (states). Users select a single region
 * by tapping the button; the selection is stored as `regionIds: [regionId]`.
 * @param _context - Grammy menu context used for reading current session state.
 * @param range - The menu range to populate with location buttons.
 * @param regions - The hierarchical list of regions. Only top-level entries are displayed.
 */
export const dynamicLocationMenu = (_context: GrammyMenuContext, range: MenuRange<GrammyMenuContext>, regions: StfalconRegion[]) => {
  const allRegions = isIdWhitelisted(_context.from?.id) ? [...regions, TEST_REGION] : regions;
  const selectedRegionIds = _context.chatSession.chatSettings.airRaidAlertSettings.regionIds;
  const pageIndex = resolvePageIndex(allRegions, selectedRegionIds);
  const maxPageIndex = Math.ceil(allRegions.length / PAGE_SIZE);
  const startIndex = (pageIndex - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, allRegions.length);
  let columnIndex = 0;

  /**
   * Creates a selectable text button for a region in the menu.
   * @param region - The region to render as a button.
   * @returns The updated menu range with the new button appended.
   */
  function createTextButton(region: StfalconRegion) {
    const isSelected = selectedRegionIds.includes(region.regionId);
    const displayName = isSelected ? `✅ ${region.regionName}` : region.regionName;

    return range.text(displayName, onlyAdmin, (context: GrammyContext) => {
      context.chatSession.chatSettings.airRaidAlertSettings.regionIds = isSelected ? [] : [region.regionId];
      alarmChatService.updateChat(context.chatSession, context.chat?.id);

      const selectedName = isSelected ? null : region.regionName;

      context
        .editMessageText(getAirRaidAlarmSettingsMessage(context, _context.chatSession.chatSettings, selectedName), { parse_mode: 'HTML' })
        .catch(handleError);
    });
  }

  /**
   * Creates a "next page" navigation button for the location menu.
   * @returns The updated menu range with the next-page button appended.
   */
  function createNextButton() {
    return range.text(_context.t('pagination-next-page'), onlyAdmin, (context) => {
      context.menu.update();
    });
  }

  /**
   * Creates a "previous page" navigation button for the location menu.
   * @returns The updated menu range with the previous-page button appended.
   */
  function createPreviousButton() {
    return range.text(_context.t('pagination-previous-page'), onlyAdmin, (context) => {
      context.menu.update();
    });
  }

  for (let index = startIndex; index < endIndex; index += 1) {
    // eslint-disable-next-line security/detect-object-injection
    const region = allRegions[index];

    if (columnIndex % 2 === 0) {
      if (endIndex === index + 1) {
        createTextButton(region).row();
      } else {
        createTextButton(region);
      }
    } else {
      createTextButton(region).row();
    }

    columnIndex += 1;
  }

  if (pageIndex === 1 && maxPageIndex > 1) {
    createNextButton();
  } else if (pageIndex > 1 && pageIndex !== maxPageIndex) {
    createPreviousButton();
    createNextButton();
  } else if (pageIndex === maxPageIndex && maxPageIndex > 1) {
    createPreviousButton();
  }
};
