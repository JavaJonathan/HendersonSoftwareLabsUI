/** Shared layout for the Automation Engine: stations sit above a conveyor; jobs ride the belt. */

export const VB_W = 380;
export const VB_H = 200;

/** Station (node) centre y, and the belt the job tokens travel along. */
export const NODE_CY = 74;
export const RAIL_Y = 136;
export const NODE_W = 60;
export const NODE_H = 58;
export const LABEL_Y = 162;

/** Station centre x in viewBox units (≈ 13 / 38 / 62 / 87 % across the stage). */
export const STAGE_CX = [50, 143, 236, 329];

/** Job tokens travel from ENTRY_X to EXIT_X along the belt, spread across 3 lanes. */
export const ENTRY_X = 22;
export const EXIT_X = 360;
export const LANE_DY = 6;

/** Progress fraction (0–1 across ENTRY_X→EXIT_X) at which a job reaches each station. */
export const STAGE_FRACS = STAGE_CX.map((cx) => (cx - ENTRY_X) / (EXIT_X - ENTRY_X));
