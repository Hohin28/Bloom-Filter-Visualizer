#include <bits/stdc++.h>
using namespace std;

const string STATE_FILE = "state.txt";

int M = 30;
int K = 3;
int insertedCount = 0;
vector<int> bitArray;

void saveState() {
    ofstream out(STATE_FILE);
    out << M << "\n";
    out << K << "\n";
    out << insertedCount << "\n";
    for (int i = 0; i < M; i++) out << bitArray[i] << " ";
    out.close();
}

void loadState() {
    ifstream in(STATE_FILE);
    if (!in.is_open()) {
        M = 30;
        K = 3;
        insertedCount = 0;
        bitArray.assign(M, 0);
        return;
    }

    in >> M;
    in >> K;
    in >> insertedCount;

    bitArray.assign(M, 0);
    for (int i = 0; i < M; i++) in >> bitArray[i];
    in.close();
}

int hashBase(const string &s, int base) {
    long long h = 0;
    for (char c : s) h = (h * base + (int)c) % M;
    return (int)h;
}

// produce K hashes using different bases
vector<int> getHashes(const string &s) {
    vector<int> bases = {31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83};
    vector<int> hashes;
    for (int i = 0; i < K; i++) {
        int base = bases[i % bases.size()];
        hashes.push_back(hashBase(s, base));
    }
    return hashes;
}

double falsePositiveProbability() {
    // p = (1 - e^(-kn/m))^k
    double k = K;
    double n = insertedCount;
    double m = M;
    return pow((1 - exp(-(k * n) / m)), k);
}

int main(int argc, char* argv[]) {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    loadState();

    if (argc < 2) {
        cout << "{ \"error\": \"No command provided\" }\n";
        return 0;
    }

    string cmd = argv[1];

    if (cmd == "init") {
        if (argc < 4) {
            cout << "{ \"error\": \"Usage: init <M> <K>\" }\n";
            return 0;
        }

        int newM = stoi(argv[2]);
        int newK = stoi(argv[3]);

        if (newM <= 0 || newM > 10000) {
            cout << "{ \"error\": \"Invalid M. Choose 1..10000\" }\n";
            return 0;
        }
        if (newK <= 0 || newK > 13) {
            cout << "{ \"error\": \"Invalid K. Choose 1..13\" }\n";
            return 0;
        }

        M = newM;
        K = newK;
        insertedCount = 0;
        bitArray.assign(M, 0);
        saveState();

        cout << "{";
        cout << "\"operation\":\"init\",";
        cout << "\"M\":" << M << ",";
        cout << "\"K\":" << K << ",";
        cout << "\"n\":" << insertedCount << ",";
        cout << "\"falsePositiveProb\":" << falsePositiveProbability() << ",";
        cout << "\"bitArray\":[";
        for (int i = 0; i < M; i++) cout << bitArray[i] << (i + 1 < M ? "," : "");
        cout << "]";
        cout << "}\n";
        return 0;
    }

    else if (cmd == "insert") {
        if (argc < 3) {
            cout << "{ \"error\": \"No word provided\" }\n";
            return 0;
        }

        string word = argv[2];
        auto hashes = getHashes(word);

        vector<int> changed;
        for (int idx : hashes) {
            if (bitArray[idx] == 0) changed.push_back(idx);
            bitArray[idx] = 1;
        }

        insertedCount++;
        saveState();

        cout << "{";
        cout << "\"operation\":\"insert\",";
        cout << "\"word\":\"" << word << "\",";
        cout << "\"M\":" << M << ",";
        cout << "\"K\":" << K << ",";
        cout << "\"n\":" << insertedCount << ",";
        cout << "\"hashes\":[";
        for (int i = 0; i < (int)hashes.size(); i++)
            cout << hashes[i] << (i + 1 < (int)hashes.size() ? "," : "");
        cout << "],";
        cout << "\"changedBits\":[";
        for (int i = 0; i < (int)changed.size(); i++)
            cout << changed[i] << (i + 1 < (int)changed.size() ? "," : "");
        cout << "],";
        cout << "\"falsePositiveProb\":" << falsePositiveProbability() << ",";
        cout << "\"bitArray\":[";
        for (int i = 0; i < M; i++) cout << bitArray[i] << (i + 1 < M ? "," : "");
        cout << "]";
        cout << "}\n";
        return 0;
    }

    else if (cmd == "search") {
        if (argc < 3) {
            cout << "{ \"error\": \"No word provided\" }\n";
            return 0;
        }

        string word = argv[2];
        auto hashes = getHashes(word);

        bool found = true;
        for (int idx : hashes) if (bitArray[idx] == 0) found = false;

        cout << "{";
        cout << "\"operation\":\"search\",";
        cout << "\"word\":\"" << word << "\",";
        cout << "\"M\":" << M << ",";
        cout << "\"K\":" << K << ",";
        cout << "\"n\":" << insertedCount << ",";
        cout << "\"hashes\":[";
        for (int i = 0; i < (int)hashes.size(); i++)
            cout << hashes[i] << (i + 1 < (int)hashes.size() ? "," : "");
        cout << "],";
        cout << "\"result\":\"" << (found ? "probably_present" : "definitely_not_present") << "\",";
        cout << "\"falsePositiveProb\":" << falsePositiveProbability() << ",";
        cout << "\"bitArray\":[";
        for (int i = 0; i < M; i++) cout << bitArray[i] << (i + 1 < M ? "," : "");
        cout << "]";
        cout << "}\n";
        return 0;
    }

    else if (cmd == "status") {
        cout << "{";
        cout << "\"operation\":\"status\",";
        cout << "\"M\":" << M << ",";
        cout << "\"K\":" << K << ",";
        cout << "\"n\":" << insertedCount << ",";
        cout << "\"falsePositiveProb\":" << falsePositiveProbability() << ",";
        cout << "\"bitArray\":[";
        for (int i = 0; i < M; i++) cout << bitArray[i] << (i + 1 < M ? "," : "");
        cout << "]";
        cout << "}\n";
        return 0;
    }

    cout << "{ \"error\": \"Invalid command\" }\n";
    return 0;
}
