import * as XLSX from "xlsx";

const REQUIRED_COLUMNS = ["題目", "A", "B", "C", "D", "答案"];

/**
 * 解析教師上傳的 Excel 題庫。
 *
 * Excel 第一列必須為：
 * 題目 | A | B | C | D | 答案
 *
 * @param {File} file 使用者上傳的 Excel 檔案
 * @returns {Promise<Array>}
 */
export async function parseExcelQuestions(file) {
    if (!file) {
        throw new Error("請選擇 Excel 檔案");
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        throw new Error("檔案格式錯誤，請上傳 .xlsx 或 .xls 檔案");
    }

    try {
        const arrayBuffer = await file.arrayBuffer();

        const workbook = XLSX.read(arrayBuffer, {
            type: "array"
        });

        if (!workbook.SheetNames.length) {
            throw new Error("Excel 中沒有工作表");
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
            raw: false
        });

        if (rows.length === 0) {
            throw new Error("Excel 中沒有題目資料");
        }

        validateColumns(rows[0]);

        const questions = rows
            .map((row, index) => convertRowToQuestion(row, index + 2))
            .filter((question) => question !== null);

        if (questions.length === 0) {
            throw new Error("Excel 中沒有可使用的題目");
        }

        return questions;
    } catch (error) {
        console.error("解析 Excel 失敗：", error);

        if (error instanceof Error) {
            throw error;
        }

        throw new Error("Excel 解析失敗，請檢查檔案格式");
    }
}

/**
 * 檢查 Excel 是否包含必要欄位。
 */
function validateColumns(firstRow) {
    const actualColumns = Object.keys(firstRow).map((column) =>
        column.trim()
    );

    const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !actualColumns.includes(column)
    );

    if (missingColumns.length > 0) {
        throw new Error(
            `Excel 缺少必要欄位：${missingColumns.join("、")}`
        );
    }
}

/**
 * 將 Excel 的單列資料轉換成題目物件。
 */
function convertRowToQuestion(row, excelRowNumber) {
    const questionText = normalizeCell(row["題目"]);
    const optionA = normalizeCell(row["A"]);
    const optionB = normalizeCell(row["B"]);
    const optionC = normalizeCell(row["C"]);
    const optionD = normalizeCell(row["D"]);
    const answer = normalizeCell(row["答案"]).toUpperCase();

    // 完全空白的列直接忽略
    const isEmptyRow =
        !questionText &&
        !optionA &&
        !optionB &&
        !optionC &&
        !optionD &&
        !answer;

    if (isEmptyRow) {
        return null;
    }

    if (!questionText) {
        throw new Error(`第 ${excelRowNumber} 列缺少題目`);
    }

    if (!optionA || !optionB || !optionC || !optionD) {
        throw new Error(
            `第 ${excelRowNumber} 列的選項 A、B、C、D 不完整`
        );
    }

    if (!["A", "B", "C", "D"].includes(answer)) {
        throw new Error(
            `第 ${excelRowNumber} 列的答案必須是 A、B、C 或 D`
        );
    }

    const options = {
        A: optionA,
        B: optionB,
        C: optionC,
        D: optionD
    };

    return {
        question: questionText,
        options: Object.values(options),
        correctAnswer: options[answer]
    };
}

/**
 * 統一處理文字、數字和空值。
 */
function normalizeCell(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}