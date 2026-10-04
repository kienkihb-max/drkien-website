// Logic THUẦN chấm điểm phân thể cho phiếu sàng lọc (hiện ở /admin/phieu).
//
// File này KHÔNG chứa số liệu nào: nhãn, đáp án -> nhãn, hệ số, ngưỡng đều đọc
// từ các bảng cham_diem_* trên Supabase (chỉ admin đọc được, xem
// web/supabase/cham-diem.sql). Kho code công khai nên bảng điểm tuyệt đối không
// được viết vào đây. Chạy được cả trong trình duyệt lẫn node (test).
//
// Kết quả chỉ là GỢI Ý cho bác sĩ, không phải chẩn đoán.
import type { SupabaseClient } from "@supabase/supabase-js";
// Chỉ lấy `bo` của chuyên khoa từ data công khai (không có điểm số nào).
import { PHAN_VAN_DE } from "../data/phieu-thap-van.mjs";

export interface CauTraLoi {
  ma: string;
  tieu_de: string;
  gia_tri: string;
}

export interface BangChamDiem {
  /** mã nhãn -> tên hiển thị */
  nhan: Record<string, string>;
  /** mã câu -> chữ đáp án -> danh sách mã nhãn */
  dapAn: Record<string, Record<string, string[]>>;
  /** mã bộ chuyên khoa -> danh sách thể, mỗi thể có hệ số theo nhãn */
  the: Record<string, { ten: string; heSo: Record<string, number> }[]>;
  cauHinh: {
    diemToiThieu: number;
    tyLePhoiHop: number;
    soNhanTongQuat: number;
    soNhanNoiBat: number;
  };
}

export interface DemNhan { ma: string; ten: string; so: number }
export interface DiemThe { ten: string; diem: number }

export interface KetQuaChamDiem {
  canhBao: string | null;
  chuyenKhoa: string;
  demNhan: DemNhan[];
  the: DiemThe[];
  tong: number;
  ketLuan: "chua_du" | "chinh" | "tong_quat";
  theChinh: { ten: string; diem: number; ngangDiem: boolean; cacTheNgang: string[] } | null;
  thePhoiHop: DiemThe | null;
  doNoiBat: number | null;
  topNhan: DemNhan[];
  ghiChu: string;
}

export const GHI_CHU_GOI_Y = "Gợi ý, cần bác sĩ xác nhận";

// Mã bộ của một chữ chuyên khoa (vd "Cơ Xương Khớp" -> "cxk"); không có thì
// là "Chưa rõ, muốn khám tổng quát" hoặc chữ lạ.
function layMaBo(chuyenKhoa: string): string | null {
  const cau = PHAN_VAN_DE.cau_hoi.find((c: any) => c.id === "chuyen_khoa");
  const dap = (cau?.dap_an ?? []).find((d: any) => typeof d !== "string" && d.ten.trim() === chuyenKhoa.trim());
  return (dap && (dap as any).bo) || null;
}

// Đọc 4 bảng bằng phiên đăng nhập của bác sĩ. Nếu RLS chặn (chưa đăng nhập)
// thì bảng trả rỗng chứ không báo lỗi, nên cũng coi bảng nhãn rỗng là lỗi.
export async function docBangChamDiem(supabase: SupabaseClient): Promise<BangChamDiem> {
  const [nhan, dapAn, the, cauHinh] = await Promise.all([
    supabase.from("cham_diem_nhan").select("ma, ten"),
    supabase.from("cham_diem_dap_an").select("ma_cau, dap_an, nhan"),
    supabase.from("cham_diem_the").select("bo, ten_the, nhan, he_so").order("id"),
    supabase.from("cham_diem_cau_hinh").select("khoa, gia_tri"),
  ]);
  for (const r of [nhan, dapAn, the, cauHinh]) {
    if (r.error) throw new Error("Không đọc được bảng chấm điểm: " + r.error.message);
  }
  if (!nhan.data?.length) throw new Error("Bảng chấm điểm trống hoặc bạn chưa đăng nhập quyền admin");

  const bang: BangChamDiem = {
    nhan: {},
    dapAn: {},
    the: {},
    cauHinh: { diemToiThieu: 4, tyLePhoiHop: 0.7, soNhanTongQuat: 3, soNhanNoiBat: 5 },
  };
  for (const n of nhan.data) bang.nhan[n.ma] = n.ten;
  for (const d of dapAn.data ?? []) {
    (bang.dapAn[d.ma_cau] ??= {})[String(d.dap_an).trim()] = d.nhan ?? [];
  }
  const theoTen = new Map<string, { ten: string; heSo: Record<string, number> }>();
  for (const t of the.data ?? []) {
    const khoa = t.bo + "\u0000" + t.ten_the;
    let the1 = theoTen.get(khoa);
    if (!the1) {
      the1 = { ten: t.ten_the, heSo: {} };
      theoTen.set(khoa, the1);
      (bang.the[t.bo] ??= []).push(the1);
    }
    the1.heSo[t.nhan] = t.he_so;
  }
  const ch = Object.fromEntries((cauHinh.data ?? []).map((c) => [c.khoa, Number(c.gia_tri)]));
  const c = bang.cauHinh;
  c.diemToiThieu = ch.diem_toi_thieu ?? c.diemToiThieu;
  c.tyLePhoiHop = ch.ty_le_phoi_hop ?? c.tyLePhoiHop;
  c.soNhanTongQuat = ch.so_nhan_tong_quat ?? c.soNhanTongQuat;
  c.soNhanNoiBat = ch.so_nhan_noi_bat ?? c.soNhanNoiBat;
  return bang;
}

export function chamDiem(
  cauTraLoi: CauTraLoi[],
  chuyenKhoa: string | null,
  bang: BangChamDiem,
): KetQuaChamDiem {
  const tenKhoa = (chuyenKhoa ?? "").trim();
  const bo = layMaBo(tenKhoa);

  // Chỉ tính câu của đúng bộ chuyên khoa đã chọn + Phần 3 (tv_) + Phần 4 (kn_),
  // phòng khi dữ liệu lẫn câu của phần khác.
  const tienToChoPhep = [bo ? bo + "_" : null, "tv_", "kn_"].filter(Boolean) as string[];

  const dem: Record<string, number> = {};
  let canhBao: string | null = null;
  for (const cau of cauTraLoi) {
    if (!tienToChoPhep.some((t) => cau.ma.startsWith(t))) continue;
    const giaTri = String(cau.gia_tri ?? "");
    if (bo && cau.ma === bo + "_dau_hieu_nguy_hiem" && giaTri.trim() === "Có") {
      canhBao = "Dấu hiệu cảnh báo " + tenKhoa;
    }
    const bangCau = bang.dapAn[cau.ma];
    if (!bangCau) continue;
    for (const phan of giaTri.split(" | ")) {
      const dapAn = phan.trim();
      // "Khác: chữ tự viết" không có nhãn nên không cộng.
      for (const n of bangCau[dapAn] ?? []) dem[n] = (dem[n] ?? 0) + 1;
    }
  }

  const demNhan: DemNhan[] = Object.entries(dem)
    .filter(([, so]) => so > 0)
    .map(([ma, so]) => ({ ma, ten: bang.nhan[ma] ?? ma, so }))
    .sort((a, b) => b.so - a.so);

  const ch = bang.cauHinh;
  const ghiChu = GHI_CHU_GOI_Y;
  const ketQuaRong = { canhBao, chuyenKhoa: tenKhoa, demNhan, the: [], tong: 0, theChinh: null, thePhoiHop: null, doNoiBat: null, ghiChu };

  // Chưa rõ / không có danh sách thể: chỉ nêu top nhãn.
  const dsThe = bo ? bang.the[bo] : undefined;
  if (!dsThe?.length) {
    return { ...ketQuaRong, ketLuan: "tong_quat", topNhan: demNhan.slice(0, ch.soNhanTongQuat) };
  }

  const the: DiemThe[] = dsThe
    .map((t) => ({
      ten: t.ten,
      diem: Object.entries(t.heSo).reduce((s, [n, h]) => s + (dem[n] ?? 0) * h, 0),
    }))
    .sort((a, b) => b.diem - a.diem); // sort ổn định: hòa thì giữ thứ tự khai báo
  const tong = the.reduce((s, t) => s + t.diem, 0);
  const cao = the[0].diem;
  const topNhan = demNhan.slice(0, ch.soNhanNoiBat);

  if (cao < ch.diemToiThieu) {
    return { ...ketQuaRong, the, tong, ketLuan: "chua_du", topNhan };
  }

  const ngang = the.filter((t) => t.diem === cao);
  const theChinh = {
    ten: ngang.map((t) => t.ten).join(" / "),
    diem: cao,
    ngangDiem: ngang.length > 1,
    cacTheNgang: ngang.map((t) => t.ten),
  };
  // Thể phối hợp: thể kế tiếp (không nằm trong nhóm ngang điểm) đạt ≥ 70%.
  const ke = the.find((t) => t.diem < cao);
  const thePhoiHop = ke && ke.diem >= ch.tyLePhoiHop * cao && ke.diem > 0 ? ke : null;

  return {
    canhBao, chuyenKhoa: tenKhoa, demNhan, the, tong,
    ketLuan: "chinh",
    theChinh,
    thePhoiHop,
    doNoiBat: tong > 0 ? Math.round((cao / tong) * 100) : 0,
    topNhan,
    ghiChu,
  };
}
