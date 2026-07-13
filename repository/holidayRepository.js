import Holiday from "../models/holidayModel.js";

class HolidayRepository {
  async findByNameAndDate(holidayName, date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return Holiday.findOne({
      holidayName: { $regex: new RegExp(`^${holidayName.trim()}$`, "i") },
      date: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  async findById(id) {
    return Holiday.findById(id);
  }

  async createHoliday(holidayData) {
    return Holiday.create(holidayData);
  }

  async createMany(holidays) {
    if (!holidays?.length) {
      return [];
    }

    return Holiday.insertMany(holidays, { ordered: false });
  }

  async findAll() {
    return Holiday.find().sort({ date: 1 });
  }

  async findByYear(year) {
    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    return Holiday.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });
  }

  async findBetweenDates(startDate, endDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    return Holiday.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });
  }

  async updateById(id, updateData) {
    return Holiday.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async deleteById(id) {
    return Holiday.findByIdAndDelete(id);
  }
}

export default new HolidayRepository();
