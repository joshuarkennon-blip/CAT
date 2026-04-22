/* CAT default hosted animation asset
 * This can be replaced with per-state clips as they are produced.
 */

export const DEFAULT_CAT_ASSET_CONFIG = {
  type: "video",
  // Base MP4 fallback (broad compatibility):
  src:
    "https://res.cloudinary.com/dryedvddt/video/upload/v1776845398/I_need_this_to_serve_as_a_foundation_and_need_animated_assets_for_all_these_styles_please_seed1572948196_pgqljh.mp4",
  // Prefer this as a state-specific source for modern browsers:
  // stateSources: {
  //   idle: "https://res.cloudinary.com/dryedvddt/video/upload/f_webm,vc_vp9/v1776845398/I_need_this_to_serve_as_a_foundation_and_need_animated_assets_for_all_these_styles_please_seed1572948196_pgqljh",
  // },
  poster:
    "https://res.cloudinary.com/dryedvddt/video/upload/fl_sprite/v1776845398/I_need_this_to_serve_as_a_foundation_and_need_animated_assets_for_all_these_styles_please_seed1572948196_pgqljh.jpg",
  alt: "Orange tabby CAT companion animation",
  // Future-ready override pattern:
  // stateSources: {
  //   idle: "https://res.cloudinary.com/.../idle.mp4",
  //   attentive: "https://res.cloudinary.com/.../attentive.mp4",
  //   active: "https://res.cloudinary.com/.../active.mp4",
  //   celebratory: "https://res.cloudinary.com/.../celebratory.mp4",
  // },
};
